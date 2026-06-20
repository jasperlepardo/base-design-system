/**
 * gen-semantic-shared.mjs — (re)generate tokens/semantics/shared.json from primitives.
 *
 * The mode-less semantic layer, aligned to the Figma 03 Semantics collection:
 *   scales: spacing, rounded (←radius), border-width, container, blur, breakpoint
 *   layout: role-named (Column Web/iOS/Android 1…n, Page, Grid) → primitive layout
 *   text:   the type ramp (font-family/font-size/line-height/letter-spacing per size)
 *   shadow: aliases the primitive shadow decomposition
 *   font-family / font-weight: kept as code roles — Figma can't bind fontWeight and
 *     folds family into the text ramp, so code keeps clean standalone roles that the
 *     component CSS consumes (a documented code↔Figma platform difference).
 *
 * Semantic COLORS live in light.json / dark.json (gen-semantic-color), not here.
 * Run: node scripts/gen-semantic-shared.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aliasShadowTree } from './lib/shadow.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const prim = JSON.parse(readFileSync(join(root, 'tokens/primitives.json'), 'utf8')).primitive;

// passthrough a primitive scale 1:1
const pass = (group) =>
  Object.fromEntries(
    Object.keys(prim[group]).map((k) => [k, { value: `{primitive.${group}.${k}}`, type: 'dimension' }]),
  );

// rounded ← primitive.radius (renamed group)
const rounded = Object.fromEntries(
  Object.keys(prim.radius).map((k) => [k, { value: `{primitive.radius.${k}}`, type: 'dimension' }]),
);

const fontFamily = {
  body: { value: '{primitive.font-family.sans}', type: 'fontFamily' },
  heading: { value: '{primitive.font-family.sans}', type: 'fontFamily' },
  mono: { value: '{primitive.font-family.mono}', type: 'fontFamily' },
};
const fontWeight = {
  body: { value: '{primitive.font-weight.normal}', type: 'fontWeight' },
  emphasis: { value: '{primitive.font-weight.medium}', type: 'fontWeight' },
  heading: { value: '{primitive.font-weight.semibold}', type: 'fontWeight' },
};

// text ramp — couples the 4 bindable specs per size, all aliasing primitives.
// (line-height stays the CSS-correct unitless ratio here; Figma uses px.)
const text = {};
for (const size of Object.keys(prim['font-size'])) {
  if (!(size in prim['line-height'])) continue;
  text[size] = {
    'font-family': { value: '{primitive.font-family.sans}', type: 'fontFamily' },
    'font-size': { value: `{primitive.font-size.${size}}`, type: 'dimension' },
    'line-height': { value: `{primitive.line-height.${size}}`, type: 'dimension' },
    'letter-spacing': { value: '{primitive.tracking.normal}', type: 'dimension' },
  };
}

// layout — role names mapped onto the primitive layout values (Web/iOS/Android).
const dim = (p) => ({ value: `{${p}}`, type: 'dimension' });
const num = (p) => ({ value: `{${p}}`, type: 'number' });
const cols = (vals) => Object.fromEntries(vals.map((v, i) => [i + 1, dim(`primitive.layout.Column.${v}`)]));
const grid = (plat) => ({
  count: num(`primitive.layout.Grid.${plat}.count`),
  width: dim(`primitive.layout.Grid.${plat}.width`),
  gutter: dim(`primitive.layout.Grid.${plat}.gutter`),
});
const layout = {
  Column: {
    Web: cols([84, 192, 300, 408, 516, 624, 732, 840, 948, 1056, 1164, 1272]),
    iOS: cols([74, 164, 253, 343]),
    Android: cols([70, 156, 242, 328]),
  },
  Page: {
    Web: { 'min-width': dim('primitive.layout.Screen.1440'), height: dim('primitive.layout.Screen.1024'), 'max-width': dim('primitive.layout.Screen.1920') },
    iOS: { width: dim('primitive.layout.Screen.375'), height: dim('primitive.layout.Screen.812') },
    Android: { width: dim('primitive.layout.Screen.360'), height: dim('primitive.layout.Screen.800') },
  },
  Grid: { Web: grid('Web'), iOS: grid('iOS'), Android: grid('Android') },
};

const out = {
  semantic: {
    spacing: pass('spacing'),
    rounded,
    'border-width': pass('border-width'),
    container: pass('container'),
    blur: pass('blur'),
    breakpoint: pass('breakpoint'),
    layout,
    'font-family': fontFamily,
    'font-weight': fontWeight,
    text,
    shadow: aliasShadowTree(prim.shadow, 'primitive', 'semantic'),
  },
};

writeFileSync(join(root, 'tokens/semantics/shared.json'), JSON.stringify(out, null, 2) + '\n');
const n = (o) => Object.values(o).reduce((a, v) => a + (v.value ? 1 : n(v)), 0);
console.log(`✓ shared.json — ${n(out.semantic)} tokens, groups: ${Object.keys(out.semantic).join(', ')}`);
