/**
 * sync-figma.mjs — code → Figma, on-demand.
 *
 * Transforms the token graph (tokens/*.json) into a Figma-ready variable
 * manifest at figma/variables.json:
 *
 *   Collection "Raw"        mode: Value          — Tailwind colors + scales (literals)
 *   Collection "Primitive"  mode: Value          — aliases into Raw
 *   Collection "Semantic"   modes: Light, Dark    — aliases into Primitive, per mode
 *
 * Colors are converted from Tailwind's oklch to Figma { r, g, b, a } floats.
 * Cross-tier references become Figma variable aliases (by name).
 *
 * The manifest is portable: push it into a Figma file via the Figma MCP /
 * plugin (`use_figma`) — code stays the source of truth, Figma is the mirror.
 *
 * Run: npm run figma:sync
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssColorToFigma } from './lib/color.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'));

// Walk a token tree, yielding { name, type, value } leaves (tier prefix dropped).
function flatten(node, path = []) {
  const out = [];
  for (const [k, v] of Object.entries(node)) {
    if (v && typeof v === 'object' && 'value' in v && 'type' in v) {
      out.push({ name: [...path, k].join('/'), type: v.type, value: v.value });
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

// Resolve a raw literal to a Figma value by type.
function literal(type, value) {
  if (type === 'color') return { color: cssColorToFigma(value) };
  if (type === 'fontFamily') return { string: String(value) };
  return { number: parseFloat(value) }; // dimension / fontWeight
}

function toFigmaValue(type, value) {
  return aliasOf(value) ?? literal(type, value);
}

// --- Raw + Primitive: single "Value" mode ---
function singleModeCollection(name, leaves) {
  return {
    name,
    modes: ['Value'],
    variables: leaves.map((l) => ({
      name: l.name,
      type: figmaType(l.type),
      valuesByMode: { Value: toFigmaValue(l.type, l.value) },
    })),
  };
}

const rawLeaves = [...flatten(read('tokens/raw.json').raw, []), ...flatten(read('tokens/scale.json').raw, [])];
const primitiveLeaves = flatten(read('tokens/primitives.json').primitive, []);

// --- Semantic: Light + Dark modes (shared tokens identical in both) ---
const shared = flatten(read('tokens/semantics/shared.json').semantic, []);
const light = flatten(read('tokens/semantics/light.json').semantic, []);
const dark = flatten(read('tokens/semantics/dark.json').semantic, []);

const byName = new Map();
const register = (leaf, mode) => {
  const entry =
    byName.get(leaf.name) ??
    byName.set(leaf.name, { name: leaf.name, type: figmaType(leaf.type), valuesByMode: {} }).get(leaf.name);
  entry.valuesByMode[mode] = toFigmaValue(leaf.type, leaf.value);
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
    singleModeCollection('Raw', rawLeaves),
    singleModeCollection('Primitive', primitiveLeaves),
    { name: 'Semantic', modes: ['Light', 'Dark'], variables: [...byName.values()] },
  ],
};

const dest = resolve(root, 'figma/variables.json');
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, JSON.stringify(manifest, null, 2) + '\n');

const counts = manifest.collections.map((c) => `${c.name} (${c.variables.length})`).join(', ');
console.log(`✓ figma/variables.json — ${counts}`);
console.log('  Push into Figma via the Figma plugin / MCP (use_figma). Code stays the source of truth.');
