/**
 * gen-primitives.mjs — (re)generate the PRIMITIVE tier from raw.json.
 *
 * Primitive is the brand layer: it renames raw's literal Tailwind palette into
 * semantic brand families (primary→blue, success→green, …) and passes the
 * non-color scales straight through as aliases. Everything aliases raw 1:1, so
 * the only real content here is the brand color mapping + the arrangement.
 *
 * Arrangement mirrors raw's section order:
 *   color families: neutral, primary, success, warning, danger, white, black
 *   groups: color, spacing, radius, border-width, breakpoint, container, layout,
 *           font-family, font-size, font-weight, line-height, leading, tracking,
 *           shadow, blur
 * (The text composite lives at the semantic tier, not here.)
 *
 * Run: node scripts/gen-primitives.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aliasShadowTree } from './lib/shadow.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(readFileSync(join(root, 'tokens/raw.json'), 'utf8')).raw;

const SHADE_ORDER = [
  '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950',
  'a050', 'a100', 'a150', 'a200', 'a300', 'a400', 'a500', 'a600', 'a700', 'a800', 'a900',
];

// Map a brand family onto a raw color family, preserving SHADE_ORDER and only
// emitting shades that actually exist in the raw source.
const mapFamily = (rawFam) => {
  const src = raw.color[rawFam];
  const out = {};
  for (const s of SHADE_ORDER)
    if (s in src) out[s] = { value: `{raw.color.${rawFam}.${s}}`, type: 'color' };
  return out;
};

// neutral spans white→black: 0 = white solid, 1000 = black solid, the rest from
// raw.neutral (solids 50…950 then the alpha ramp). Order: 0, 50…950, 1000, a*.
const neutralOrdered = { 0: { value: '{raw.color.white.500}', type: 'color' } };
for (const s of ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'])
  neutralOrdered[s] = { value: `{raw.color.neutral.${s}}`, type: 'color' };
neutralOrdered['1000'] = { value: '{raw.color.black.500}', type: 'color' };
for (const s of SHADE_ORDER)
  if (s.startsWith('a')) neutralOrdered[s] = { value: `{raw.color.neutral.${s}}`, type: 'color' };

// white/black are alpha-only overlay families (their solids live in neutral 0/1000)
const alphaOnly = (fam) => {
  const out = {};
  for (const s of SHADE_ORDER)
    if (s.startsWith('a') && s in raw.color[fam]) out[s] = { value: `{raw.color.${fam}.${s}}`, type: 'color' };
  if ('transparent' in raw.color[fam])
    out.transparent = { value: `{raw.color.${fam}.transparent}`, type: 'color' };
  return out;
};

const color = {
  neutral: neutralOrdered,
  primary: mapFamily('blue'),
  success: mapFamily('green'),
  warning: mapFamily('amber'),
  danger: mapFamily('red'),
  white: alphaOnly('white'),
  black: alphaOnly('black'),
};

// Passthrough scale: alias every raw key 1:1, mirroring the raw leaf's type.
const passthrough = (group) => {
  const out = {};
  for (const [k, leaf] of Object.entries(raw[group]))
    out[k] = { value: `{raw.${group}.${k}}`, type: leaf.type };
  return out;
};

// layout — Screen/Column pass through raw 1:1; Grid maps each platform
// (Web/iOS/Android) onto raw column widths + grid count/gutter, mirroring Figma's
// primitive layout. (The text composite lives at the SEMANTIC tier, not here.)
const passLayout = (sub) =>
  Object.fromEntries(
    Object.keys(raw.layout[sub]).map((k) => [k, { value: `{raw.layout.${sub}.${k}}`, type: 'dimension' }]),
  );
const gridCount = (k) => ({ value: `{raw.layout.Grid.count.${k}}`, type: 'number' });
const gridWidth = (k) => ({ value: `{raw.layout.Column.${k}}`, type: 'dimension' });
const gridGutter = (k) => ({ value: `{raw.layout.Grid.gutter.${k}}`, type: 'dimension' });
const layout = {
  Screen: passLayout('Screen'),
  Column: passLayout('Column'),
  Grid: {
    Web: { count: gridCount(12), width: gridWidth(84), gutter: gridGutter(24) },
    iOS: { count: gridCount(4), width: gridWidth(74), gutter: gridGutter(16) },
    Android: { count: gridCount(4), width: gridWidth(70), gutter: gridGutter(16) },
  },
};

const out = {
  primitive: {
    color,
    spacing: passthrough('spacing'),
    radius: passthrough('radius'),
    'border-width': passthrough('border-width'),
    breakpoint: passthrough('breakpoint'),
    container: passthrough('container'),
    layout,
    'font-family': passthrough('font-family'),
    'font-size': passthrough('font-size'),
    'font-weight': passthrough('font-weight'),
    'line-height': passthrough('line-height'),
    leading: passthrough('leading'),
    tracking: passthrough('tracking'),
    shadow: aliasShadowTree(raw.shadow, 'raw', 'primitive'),
    blur: passthrough('blur'),
  },
};

writeFileSync(join(root, 'tokens/primitives.json'), JSON.stringify(out, null, 2) + '\n');

const n = (o) => Object.values(o).reduce((a, v) => a + (v.value ? 1 : n(v)), 0);
console.log(
  `✓ primitives.json — ${Object.keys(color).length} color families, ` +
    `${n(color)} color tokens, groups: ${Object.keys(out.primitive).join(', ')}`,
);
