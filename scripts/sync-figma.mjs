/**
 * sync-figma.mjs — code → Figma, on-demand.
 *
 * Transforms the resolved token graph (ctx.paths.tokensDir) into a Figma-ready
 * variable manifest at <outFigma>/variables.json:
 *
 *   Collection "Raw"        mode: Value          — Tailwind colors + scales (literals)
 *   Collection "Primitive"  mode: Value          — aliases into Raw
 *   Collection "Semantic"   modes: Light, Dark    — aliases into Primitive, per mode
 *
 * Colors are converted from Tailwind's oklch to Figma { r, g, b, a } floats.
 * Cross-tier references become Figma variable aliases (by name). The raw tier
 * now carries spacing/radius/type/shadows too (from gen-raw-from-tailwind), so
 * this reads raw.json alone — the old tokens/scale.json is gone.
 *
 * Run: npm run figma:sync  (or `jspr gen figma`)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { cssColorToFigma } from './lib/color.mjs';
import { dimToPx } from './lib/units.mjs';
import { loadConfig, materializeTokens } from './lib/config.mjs';
import { run as genRaw } from './gen-raw-from-tailwind.mjs';

// Walk a token tree, yielding { name, type, value, path } leaves (tier dropped from name).
function flatten(node, path = []) {
  const out = [];
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === 'object' && 'value' in v && 'type' in v) {
      // Composite box-shadow (`shadow.{size}.box`) is CSS-only — it can't be a
      // Figma variable; the decomposed parts carry it instead. Skip it.
      if (v.type === 'shadow') continue;
      out.push({ name: [...path, k].join('/'), type: v.type, value: v.value, path: [...path, k] });
    } else if (v && typeof v === 'object') {
      out.push(...flatten(v, [...path, k]));
    }
  }
  return out;
}

const TIER_OF = { raw: 'Raw', primitive: 'Primitive', semantic: 'Semantic' };
const figmaType = (t) => (t === 'color' ? 'COLOR' : t === 'fontFamily' ? 'STRING' : 'FLOAT');

// A {tier.path...} reference → { alias: { collection, name } }
function aliasOf(ref) {
  const m = String(ref).match(/^\{(.+)\}$/);
  if (!m) return null;
  const [tier, ...rest] = m[1].split('.');
  return { alias: { collection: TIER_OF[tier], name: rest.join('/') } };
}

function literal(type, value, remRoot) {
  if (type === 'color') return { color: cssColorToFigma(value) };
  // Figma font variables hold ONE real family — use the first of the CSS stack
  // (quotes stripped), e.g. "'Inter', ui-sans-serif, …" → "Inter".
  if (type === 'fontFamily')
    return { string: String(value).split(',')[0].trim().replace(/^['"]|['"]$/g, '') };
  // dimension / fontWeight → px NUMBER (rem×remRoot); Figma has no rem.
  return { number: dimToPx(value, remRoot) };
}

const toFigmaValue = (type, value, remRoot) => aliasOf(value) ?? literal(type, value, remRoot);

function singleModeCollection(name, leaves, remRoot) {
  return {
    name,
    modes: ['Value'],
    variables: leaves.map((l) => ({
      name: l.name,
      type: figmaType(l.type),
      valuesByMode: { Value: toFigmaValue(l.type, l.value, remRoot) },
    })),
  };
}

export async function run(ctx) {
  const { tokensDir, outFigma } = ctx.paths;
  const remRoot = ctx.spacing?.remRoot ?? 16;
  const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

  const rawLeaves = flatten(read(join(tokensDir, 'raw.json')).raw, []);
  const primitiveLeaves = flatten(read(join(tokensDir, 'primitives.json')).primitive, []);

  // Semantic: Light + Dark modes (shared tokens identical in both).
  const shared = flatten(read(join(tokensDir, 'semantics', 'shared.json')).semantic, []);
  const light = flatten(read(join(tokensDir, 'semantics', 'light.json')).semantic, []);
  const dark = flatten(read(join(tokensDir, 'semantics', 'dark.json')).semantic, []);

  const byName = new Map();
  const register = (leaf, mode) => {
    const entry =
      byName.get(leaf.name) ??
      byName
        .set(leaf.name, { name: leaf.name, type: figmaType(leaf.type), valuesByMode: {} })
        .get(leaf.name);
    entry.valuesByMode[mode] = toFigmaValue(leaf.type, leaf.value, remRoot);
  };
  for (const l of shared) {
    register(l, 'Light');
    register(l, 'Dark');
  }
  for (const l of light) register(l, 'Light');
  for (const l of dark) register(l, 'Dark');

  const manifest = {
    $schema: 'base-design-system/figma-variables@1',
    collections: [
      singleModeCollection('Raw', rawLeaves, remRoot),
      singleModeCollection('Primitive', primitiveLeaves, remRoot),
      { name: 'Semantic', modes: ['Light', 'Dark'], variables: [...byName.values()] },
    ],
  };

  const dest = join(outFigma, 'variables.json');
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, JSON.stringify(manifest, null, 2) + '\n');

  const counts = manifest.collections.map((c) => `${c.name} (${c.variables.length})`).join(', ');
  console.log(`✓ ${resolve(dest)} — ${counts}`);
  console.log(
    '  Push into Figma via the Figma plugin / MCP (use_figma). Code stays the source of truth.',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ctx = await loadConfig();
  await genRaw(ctx);
  materializeTokens(ctx);
  await run(ctx);
}
