/**
 * gen-primitives.mjs — (re)generate the PRIMITIVE tier from raw.json.
 *
 * Primitive is the brand layer: it renames raw's literal Tailwind palette into
 * semantic brand families (primary→blue, success→green, …) and passes the
 * non-color scales straight through as aliases. Everything aliases raw 1:1, so
 * the only real content here is the brand color mapping + the arrangement.
 *
 * Arrangement mirrors raw's section order, with two primitive-only additions:
 *   color families: neutral, primary, success, warning, danger, white, black
 *   groups: color, spacing, radius, border-width, breakpoint, container,
 *           font-family, font-size, font-weight, line-height, leading, tracking,
 *           text (composite size/line-height), shadow, blur
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

// text — primitive-only composite coupling font-size + line-height per size.
const text = {};
for (const size of Object.keys(raw['font-size'])) {
  if (!(size in raw['line-height'])) continue;
  text[size] = {
    'font-size': { value: `{raw.font-size.${size}}`, type: 'dimension' },
    'line-height': { value: `{raw.line-height.${size}}`, type: 'dimension' },
  };
}

const out = {
  primitive: {
    color,
    spacing: passthrough('spacing'),
    radius: passthrough('radius'),
    'border-width': passthrough('border-width'),
    breakpoint: passthrough('breakpoint'),
    container: passthrough('container'),
    'font-family': passthrough('font-family'),
    'font-size': passthrough('font-size'),
    'font-weight': passthrough('font-weight'),
    'line-height': passthrough('line-height'),
    leading: passthrough('leading'),
    tracking: passthrough('tracking'),
    text,
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
