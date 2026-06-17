/**
 * gen-figma-rename-map.mjs — builds a REVIEW-ONLY old→new rename/remap map
 * between the existing JSPR Tokens Figma library and the code manifest
 * (figma/variables.json). Writes docs/figma-rename-map.md + figma/rename-map.json.
 * Does NOT touch Figma. Pure analysis.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'figma/variables.json'), 'utf8'));
const fx = JSON.parse(readFileSync(join(root, 'figma/_figma-existing-scales.json'), 'utf8'));

// ---- code side: resolve every var to a final literal (follow aliases) ----
const codeCol = {};
for (const c of manifest.collections) codeCol[c.name] = c;
const codeByCollName = {}; // "Collection/name" -> var
for (const c of manifest.collections)
  for (const v of c.variables) codeByCollName[`${c.name}/${v.name}`] = v;

function resolve(collection, name, seen = 0) {
  const v = codeByCollName[`${collection}/${name}`];
  if (!v || seen > 10) return null;
  const val = v.valuesByMode.Value ?? v.valuesByMode.Light;
  if (val && val.alias) return resolve(val.alias.collection, val.alias.name, seen + 1);
  if (val && typeof val.number === 'number') return { kind: 'num', v: val.number };
  if (val && val.string != null) return { kind: 'str', v: val.string };
  if (val && val.color) return { kind: 'color' };
  return null;
}
const codeNames = {};
for (const c of manifest.collections) codeNames[c.name] = new Set(c.variables.map((v) => v.name));

// value -> code raw spacing/radius/font-size/etc names (for value matching)
function codeFloatByValue(collection, predicateName) {
  const out = {};
  for (const v of codeCol[collection].variables) {
    if (predicateName && !predicateName(v.name)) continue;
    const r = resolve(collection, v.name);
    if (r && r.kind === 'num') (out[r.v] ??= []).push(v.name);
  }
  return out;
}
const rawSpacingByPx = codeFloatByValue('Raw', (n) => n.startsWith('spacing/'));
const rawFontSizeByPx = codeFloatByValue('Raw', (n) => n.startsWith('font-size/'));
const rawWeightByVal = codeFloatByValue('Raw', (n) => n.startsWith('font-weight/'));
const rawLeadingByVal = codeFloatByValue('Raw', (n) => n.startsWith('line-height/'));
const rawFontFamByVal = (() => {
  const out = {};
  for (const v of codeCol['Raw'].variables) {
    if (!v.name.startsWith('font-family/')) continue;
    const r = resolve('Raw', v.name);
    if (r && r.kind === 'str') out[r.v] = v.name;
  }
  return out;
})();
const primRadiusByPx = codeFloatByValue('Primitive', (n) => n.startsWith('radius/'));
const primFontSizeByPx = codeFloatByValue('Primitive', (n) => n.startsWith('font-size/'));

// ---- build existing Figma full inventory ----
const existing = { '01 Raw': [], '02 Primitives': [], '03 Semantics': [] };
// raw colors
for (const fam of fx.rawColorFamilies)
  for (const s of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950])
    existing['01 Raw'].push(`Color/${fam}/${s}`);
for (const wb of fx.rawWhiteBlack) existing['01 Raw'].push(`Color/${wb}`);
for (const fam of fx.rawAlphaFamilies)
  for (const a of ['a050', 'a100', 'a150', 'a200']) existing['01 Raw'].push(`Color/${fam}/${a}`);
for (const px of fx.sizingPx) existing['01 Raw'].push(`Sizing/${px}`);
for (const k of Object.keys(fx.rawFontFamily)) existing['01 Raw'].push(k);
for (const w of fx.rawFontWeight) existing['01 Raw'].push(`Font/${w}`);
for (const k of Object.keys(fx.rawLeading)) existing['01 Raw'].push(`Leading/${k}`);

// ---- rename rules ----
const renames = []; // {tier, from, to, note}
const dels = []; // {tier, from, reason}
const keep = []; // {tier, from, reason}  (figma-only)
const ambiguous = [];

function codeHas(coll, name) {
  return codeNames[coll].has(name);
}

// RAW colors: Color/{fam}/{shade} -> color/{fam}/{shade}
for (const fam of fx.rawColorFamilies)
  for (const s of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
    const to = `color/${fam}/${s}`;
    renames.push({ tier: 'Raw', from: `Color/${fam}/${s}`, to, ok: codeHas('Raw', to) });
  }
for (const wb of fx.rawWhiteBlack) {
  if (wb.endsWith('/transparent')) {
    dels.push({ tier: 'Raw', from: `Color/${wb}`, reason: 'code uses CSS `transparent` keyword — no token' });
    continue;
  }
  const to = `color/${wb}`;
  renames.push({ tier: 'Raw', from: `Color/${wb}`, to, ok: codeHas('Raw', to) });
}
for (const fam of fx.rawAlphaFamilies)
  for (const a of ['a050', 'a100', 'a150', 'a200']) {
    const to = `color/${fam}/${a}`;
    renames.push({ tier: 'Raw', from: `Color/${fam}/${a}`, to, ok: codeHas('Raw', to) });
  }
// RAW Sizing -> spacing (by px value)
for (const px of fx.sizingPx) {
  const cand = rawSpacingByPx[px];
  if (cand && cand.length === 1) renames.push({ tier: 'Raw', from: `Sizing/${px}`, to: cand[0], ok: true });
  else if (cand) ambiguous.push({ tier: 'Raw', from: `Sizing/${px}`, candidates: cand });
  else dels.push({ tier: 'Raw', from: `Sizing/${px}`, reason: `no code spacing == ${px}px` });
}
// RAW Font families
for (const [k, val] of Object.entries(fx.rawFontFamily)) {
  const to = rawFontFamByVal[val];
  if (to) renames.push({ tier: 'Raw', from: k, to, ok: true });
  else dels.push({ tier: 'Raw', from: k, reason: `no code font-family == ${val}` });
}
// RAW Font weights (numeric) -> font-weight/name (by value)
for (const w of fx.rawFontWeight) {
  const cand = rawWeightByVal[w];
  if (cand && cand.length === 1) renames.push({ tier: 'Raw', from: `Font/${w}`, to: cand[0], ok: true });
  else if (cand) ambiguous.push({ tier: 'Raw', from: `Font/${w}`, candidates: cand });
  else dels.push({ tier: 'Raw', from: `Font/${w}`, reason: `no code weight == ${w}` });
}
// RAW Leading (named) -> leading/<name> by name; 'none' has no code raw equivalent
for (const k of Object.keys(fx.rawLeading)) {
  const to = `leading/${k}`;
  if (codeHas('Raw', to)) renames.push({ tier: 'Raw', from: `Leading/${k}`, to, ok: true });
  else dels.push({ tier: 'Raw', from: `Leading/${k}`, reason: `code raw has no ${to} (Tailwind leading-${k} folded into per-size line-height)` });
}

// PRIMITIVE colors
for (const [F, f] of Object.entries(fx.primColorFamilies)) {
  for (const s of ['950', '900', '800', '700', '600', '500', '400', '300', '200', '100', '050']) {
    const shade = s === '050' ? '50' : s;
    const to = `color/${f}/${shade}`;
    renames.push({ tier: 'Primitive', from: `Color/${F}/${s}`, to, ok: codeHas('Primitive', to) });
  }
  for (const a of ['a050', 'a100', 'a150', 'a200'])
    dels.push({ tier: 'Primitive', from: `Color/${F}/${a}`, reason: 'alpha lives at raw only (code decision)' });
}
// Primitive White/Black (+alpha) -> code keeps white/black via neutral.0/1000; alpha at raw
for (const wb of ['White/500', 'White/transparent', 'Black/500', 'Black/transparent'])
  dels.push({ tier: 'Primitive', from: `Color/${wb}`, reason: 'code: white/black via neutral.0/1000, no separate primitive' });
for (const C of ['White', 'Black'])
  for (const a of ['a100','a200','a300','a400','a500','a600','a700','a800','a900'])
    dels.push({ tier: 'Primitive', from: `Color/${C}/${a}`, reason: 'alpha lives at raw only (code decision)' });
// Primitive Rounded -> radius (endpoints by name; middle by value).
// NB: code Raw/radius/full mis-resolves to 0px (dimToPx can't parse calc(infinity*1px)) — endpoint pinned by name.
for (const px of fx.primRounded) {
  let to = null;
  if (px === 0) to = 'radius/none';
  else if (px === 9999) to = 'radius/full';
  else {
    const cand = (primRadiusByPx[px] || []).filter((n) => n !== 'radius/full' && n !== 'radius/none');
    if (cand.length === 1) to = cand[0];
    else if (cand.length > 1) { ambiguous.push({ tier: 'Primitive', from: `Rounded/${px}`, candidates: cand }); continue; }
  }
  if (to) renames.push({ tier: 'Primitive', from: `Rounded/${px}`, to, ok: codeHas('Primitive', to) });
  else dels.push({ tier: 'Primitive', from: `Rounded/${px}`, reason: `no code radius == ${px}px` });
}
// Primitive Text -> font-size (value match)
for (const px of fx.primTextPx) {
  const cand = primFontSizeByPx[px];
  if (cand && cand.length === 1) renames.push({ tier: 'Primitive', from: `Text/${px}`, to: cand[0], ok: true });
  else if (cand) ambiguous.push({ tier: 'Primitive', from: `Text/${px}`, candidates: cand });
  else dels.push({ tier: 'Primitive', from: `Text/${px}`, reason: `no code font-size == ${px}px` });
}
// Primitive Font weight names -> font-weight/<name>
for (const n of fx.primFontWeightNames) {
  const to = `font-weight/${n}`;
  if (codeHas('Primitive', to)) renames.push({ tier: 'Primitive', from: `Font/${n}`, to, ok: true });
  else dels.push({ tier: 'Primitive', from: `Font/${n}`, reason: `no code ${to}` });
}
// Primitive Font families
for (const r of ['sans', 'serif', 'mono']) {
  const to = `font-family/${r}`;
  if (codeHas('Primitive', to)) renames.push({ tier: 'Primitive', from: `Font/${r}`, to, ok: true });
  else dels.push({ tier: 'Primitive', from: `Font/${r}`, reason: `no code ${to}` });
}
// Primitive Spacing -> spacing (same step keys, just confirm)
for (const step of fx.primSpacingSteps) {
  const to = `spacing/${step}`;
  if (codeHas('Primitive', to)) renames.push({ tier: 'Primitive', from: `Spacing/${step}`, to, ok: true, note: 'case/identity' });
  else dels.push({ tier: 'Primitive', from: `Spacing/${step}`, reason: `no code ${to}` });
}

// PRIMITIVE Leading (numeric 3..32 + named) -> code primitive line-height (named xs..9xl)
keep.push({ tier: 'Primitive', from: 'Leading/* (3..32 numeric + none..loose)', reason: 'code primitive line-height is named xs..9xl (13) — map by value, not 1:1; needs confirm (see open Qs)' });

// SEMANTIC bg -> background/* (explicit dictionary from figma-token-diff.md)
const bgMap = {
  'default': 'background/default',
  'secondary': 'background/subtle',
  'neutral-subtle': 'background/muted',
  'tertiary': 'background/strong',
  'quarternary': 'background/stronger',
  'default-solid': 'background/inverse',
  'secondary-solid': 'background/inverse-secondary',
  'tertiary-solid': 'background/inverse-tertiary',
  'quarternary-solid': 'background/inverse-quaternary',
  'disabled': 'background/disabled',
  'transparent': 'background/transparent',
  'white_subtle': 'background/white-subtle',
  'black_subtle': 'background/black-subtle',
  'primary': 'primary/default',
  'primary_hover': 'primary/hover',
  'primary-subtle': 'primary/subtle',
  'primary-subtle_hover': 'primary/subtle-hover',
  'success': 'success/default',
  'success_hover': 'success/hover',
  'success-subtle': 'success/subtle',
  'success-subtle_hover': 'success/subtle-hover',
  'warning': 'warning/default',
  'warning_hover': 'warning/hover',
  'warning-subtle': 'warning/subtle',
  'warning-subtle_hover': 'warning/subtle-hover',
  'danger': 'danger/default',
  'danger_hover': 'danger/hover',
  'danger-subtle': 'danger/subtle',
  'danger-subtle_hover': 'danger/subtle-hover',
  'transparent': null,
};
delete bgMap.transparent;
const bgDelete = { 'neutral': 'niche (bg/neutral)', 'neutral_hover': 'niche skip', 'neutral-subtle_hover': 'niche skip', 'white': 'use raw neutral-0', 'white_hover': 'niche alpha', 'black': 'use raw neutral-1000', 'black_hover': 'niche alpha', 'transparent': 'code uses CSS `transparent` keyword — no token' };
for (const k of fx.semanticColorBg) {
  if (bgMap[k]) renames.push({ tier: 'Semantic', from: `Color/bg/${k}`, to: bgMap[k], ok: codeHas('Semantic', bgMap[k]) });
  else dels.push({ tier: 'Semantic', from: `Color/bg/${k}`, reason: bgDelete[k] || 'no code role' });
}
// SEMANTIC fg -> delete all (rebind components first)
existing['03 Semantics'] = []; // fg handled below
const fgList = ['default','default-solid','secondary','secondary-solid','tertiary','tertiary-solid','quarternary','quarternary-solid','primary','primary_hover','primary-subtle','primary-subtle_hover','success','success_hover','success-subtle','success-subtle_hover','warning','warning_hover','warning-subtle','warning-subtle_hover','danger','danger_hover','danger-subtle','danger-subtle_hover','white','white_hover','white_subtle','black','black_hover','black_subtle','disabled','transparent'];
for (const k of fgList) dels.push({ tier: 'Semantic', from: `Color/fg/${k}`, reason: 'fg tier dropped — REBIND components to text/intent first' });
// SEMANTIC border
const borderMap = {
  'default': 'border/default',
  'disabled': 'border/disabled',
  'primary': 'primary/border',
  'primary_subtle': 'primary/border-subtle',
  'success': 'success/border',
  'success_subtle': 'success/border-subtle',
  'warning': 'warning/border',
  'warning_subtle': 'warning/border-subtle',
  'danger': 'danger/border',
  'danger_subtle': 'danger/border-subtle',
};
const borderDel = { 'white': 'use raw', 'black': 'use raw', 'transparent': 'code uses CSS `transparent` keyword — no token' };
for (const k of fx.semanticColorBorder) {
  if (borderMap[k]) renames.push({ tier: 'Semantic', from: `Color/border/${k}`, to: borderMap[k], ok: codeHas('Semantic', borderMap[k]) });
  else dels.push({ tier: 'Semantic', from: `Color/border/${k}`, reason: borderDel[k] || 'no code role' });
}
// SEMANTIC text
const textMap = {
  'heading': 'text/heading',
  'body': 'text/body',
  'muted': 'text/muted',
  'caption': 'text/caption',
  'placeholder': 'text/placeholder',
  'disabled': 'text/disabled',
  'heading_on-primary': 'text/inverse',
  'primary': 'text/link',
  'body_on-primary': 'text/on-primary-muted',
  'muted_on-primary': 'text/on-primary-subtle',
};
const textDel = {
  'heading_brand': 'niche (skipped in code)',
  'primary_hover': 'per-intent text skipped (use intent token)',
  'success': 'per-intent text skipped', 'success_hover': 'per-intent text skipped',
  'warning': 'per-intent text skipped', 'warning_hover': 'per-intent text skipped',
  'danger': 'per-intent text skipped', 'danger_hover': 'per-intent text skipped',
  'white': 'black/white text family skipped', 'white_hover': 'skipped', 'white_disabled': 'skipped',
  'black': 'skipped', 'black_hover': 'skipped', 'black_disabled': 'skipped',
};
for (const k of fx.semanticColorText) {
  if (textMap[k]) renames.push({ tier: 'Semantic', from: `Color/text/${k}`, to: textMap[k], ok: codeHas('Semantic', textMap[k]) });
  else dels.push({ tier: 'Semantic', from: `Color/text/${k}`, reason: textDel[k] || 'no code role' });
}
// SEMANTIC rounded -> radius (same t-shirt keys)
for (const k of ['none','xs','sm','md','lg','xl','2xl','3xl','4xl','full']) {
  const to = `radius/${k}`;
  if (codeHas('Semantic', to)) renames.push({ tier: 'Semantic', from: `rounded/${k}`, to, ok: true });
  else dels.push({ tier: 'Semantic', from: `rounded/${k}`, reason: `no code ${to}` });
}
// SEMANTIC spacing -> space/* (code uses t-shirt names, not numeric steps) -> value match deferred
keep.push({ tier: 'Semantic', from: 'spacing/* (numeric steps)', reason: 'code semantic uses t-shirt space/none..3xl — needs value/role decision (see open Qs)' });
// SEMANTIC layout/* -> figma-only
keep.push({ tier: 'Semantic', from: 'layout/* (Page/Grid/Column canvas grid)', reason: 'canvas grid — Figma-only by decision' });
keep.push({ tier: 'Raw/Primitive', from: 'Layout/* (Column/Screen/Grid)', reason: 'canvas grid — Figma-only by decision' });
// SEMANTIC S Font Family/Weight/Size/Line Height -> code semantic type roles
keep.push({ tier: 'Semantic', from: 'S Font Family/Weight/Size/Line Height/*', reason: 'map to code font-family/font-weight/font-size/line-height semantics — naming differs (drop "S " prefix), needs confirm' });

// ---- code-only NEW (no existing source) ----
const mappedToTargets = new Set(renames.map((r) => `${r.tier}/${r.to}`));
const newInCode = [];
for (const c of manifest.collections)
  for (const v of c.variables)
    if (!mappedToTargets.has(`${c.name}/${v.name}`)) newInCode.push(`${c.name}/${v.name}`);

// ---- emit ----
const okR = renames.filter((r) => r.ok !== false);
const badR = renames.filter((r) => r.ok === false);
const summary = {
  renames: renames.length,
  renamesResolved: okR.length,
  renamesUnresolvedTarget: badR.length,
  deletes: dels.length,
  keepFigmaOnly: keep.length,
  ambiguous: ambiguous.length,
  newInCode: newInCode.length,
};
writeFileSync(join(root, 'figma/rename-map.json'),
  JSON.stringify({ summary, renames, deletes: dels, keepFigmaOnly: keep, ambiguous, newInCode }, null, 2) + '\n');

const lines = [];
const p = (s = '') => lines.push(s);
p('# Figma rename / remap map — REVIEW ONLY (no writes performed)');
p('');
p('Generated by `scripts/gen-figma-rename-map.mjs`. Maps the **existing JSPR Tokens**');
p('Figma library (old BDO naming) → the **code manifest** (`figma/variables.json`).');
p('Apply as in-place **renames** on the existing collection IDs to preserve variable');
p('IDs (and the linked Components file\'s bindings).');
p('');
p('## Summary');
p('');
p('| bucket | count |');
p('|---|---:|');
p(`| ✅ renames (target exists in code) | ${summary.renamesResolved} |`);
p(`| ⚠️ renames (target NOT found in code) | ${summary.renamesUnresolvedTarget} |`);
p(`| 🗑️ deletes (dropped tiers / niche skips) | ${summary.deletes} |`);
p(`| 📌 keep Figma-only (canvas grid etc.) | ${summary.keepFigmaOnly} |`);
p(`| ❓ ambiguous (value matched >1 code var) | ${summary.ambiguous} |`);
p(`| ➕ new in code (no Figma source → CREATE) | ${summary.newInCode} |`);
p('');
p('## Collection renames');
p('| from | to |');
p('|---|---|');
p('| `01 Raw` | `Raw` |');
p('| `02 Primitives` | `Primitive` |');
p('| `03 Semantics` | `Semantic` |');
p('');
for (const tier of ['Raw', 'Primitive', 'Semantic']) {
  p(`## ${tier} — renames`);
  p('| from (Figma) | to (code) | target exists? |');
  p('|---|---|:--:|');
  for (const r of renames.filter((r) => r.tier === tier))
    p(`| \`${r.from}\` | \`${r.to}\` | ${r.ok === false ? '⚠️ NO' : '✅'} |`);
  p('');
}
p('## Deletes (after rebinding any component consumers)');
p('| tier | from | reason |');
p('|---|---|---|');
for (const d of dels) p(`| ${d.tier} | \`${d.from}\` | ${d.reason} |`);
p('');
if (ambiguous.length) {
  p('## ❓ Ambiguous (need a pick)');
  p('| tier | from | code candidates |');
  p('|---|---|---|');
  for (const a of ambiguous) p(`| ${a.tier} | \`${a.from}\` | ${a.candidates.map((c) => '`' + c + '`').join(', ')} |`);
  p('');
}
p('## Keep Figma-only');
p('| tier | what | why |');
p('|---|---|---|');
for (const k of keep) p(`| ${k.tier} | \`${k.from}\` | ${k.reason} |`);
p('');
p('## ➕ New in code (no Figma source — would be CREATEd)');
p(`${summary.newInCode} variables. Grouped count by prefix:`);
const byPrefix = {};
for (const n of newInCode) {
  const key = n.split('/').slice(0, 2).join('/');
  byPrefix[key] = (byPrefix[key] || 0) + 1;
}
p('');
p('| prefix | count |');
p('|---|---:|');
for (const [k, v] of Object.entries(byPrefix).sort((a, b) => b[1] - a[1])) p(`| \`${k}\` | ${v} |`);
p('');
p('## ⚠️ Open decisions (need your call before any write)');
p('');
p('1. **Semantic `spacing/*` (numeric steps) → code `space/*` (t-shirt).** Code semantic spacing uses');
p('   `space/none|3xs|2xs|xs|sm|md|lg|xl|2xl|3xl` (10), not numeric steps. The Figma\'s ~35 numeric');
p('   `spacing/*` don\'t map 1:1 — most would be **deleted**, 10 mapped by value. Confirm the t-shirt collapse.');
p('2. **Primitive `Leading/*` (3..32 + named) → code `line-height/*` (named xs..9xl).** Lossy value-match —');
p('   Figma has ~28 leading vars, code has 13. Confirm consolidation.');
p('3. **`S Font Family|Weight|Size|Line Height/*` → code semantic type roles.** Drop the `S ` prefix and map to');
p('   `font-family/*`, `font-weight/*`, `font-size/*`, `line-height/*`. Confirm naming.');
p('4. **`Color/fg/*` (32) deletion — SCANNED, low risk in this file.** Full scan of all content pages');
p('   (Colors 1120, Typography 219, Effect Styles 3, Cover 25 nodes) found the `fg/*` tier used by exactly');
p('   **one node**: a doc rectangle "Box" (`6658:952`) on the Effect Styles page whose **fill binds `fg/default`**.');
p('   This file has **no components** — just variables + foundation docs. So deleting `fg/*` only orphans that one');
p('   rectangle (trivial rebind → `text/heading` or `background/default`). ⚠️ **Open:** the decisions doc assumes a');
p('   separate **"linked Components file"** consuming these vars, but no such file key exists in the repo. If one');
p('   exists it must be scanned for remote `fg/*` bindings before deletion — otherwise #4 is settled.');
p('5. **431 new-in-code CREATEs** — dominated by **294 raw colors** (alpha ramps on all 28 families + the 6 extra');
p('   families Figma lacks). Confirm we want the full set created, or trim.');
p('6. **Code bug to fix first:** `Raw/radius/full` resolves to **0px** in the manifest (Tailwind `radius-full` /');
p('   `calc(infinity*1px)` not parsed by `dimToPx`). Fix before push so `radius/full` isn\'t pushed as 0.');
p('');
writeFileSync(join(root, 'docs/figma-rename-map.md'), lines.join('\n'));
console.log('summary:', JSON.stringify(summary, null, 2));
console.log('wrote docs/figma-rename-map.md + figma/rename-map.json');
