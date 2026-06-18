/**
 * inject-primitive-text.mjs — add the Tailwind text-* typography scale to the
 * primitive source: primitive.text.{size}.{font-size,line-height}, aliasing the
 * flat raw scale. Mirrors Tailwind's --text-{size} + --text-{size}--line-height
 * (each text size couples a font-size with its default line-height).
 *
 * Additive — leaves the flat primitive font-size/line-height (consumed by the
 * semantic font-size/line-height scale) intact.
 *
 * Run: node scripts/inject-primitive-text.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const primPath = join(root, 'tokens/primitives.json');
const SIZES = ['xs','sm','base','lg','xl','2xl','3xl','4xl','5xl','6xl','7xl','8xl','9xl'];

const prim = JSON.parse(readFileSync(primPath, 'utf8'));
prim.primitive.text = {};
for (const s of SIZES) {
  prim.primitive.text[s] = {
    'font-size': { value: `{raw.font-size.${s}}`, type: 'dimension' },
    'line-height': { value: `{raw.line-height.${s}}`, type: 'dimension' },
  };
}
writeFileSync(primPath, JSON.stringify(prim, null, 2) + '\n');
console.log(`✓ injected primitive text scale: ${SIZES.length} sizes × 2 = ${SIZES.length * 2} vars (text/${SIZES[0]}…text/${SIZES.at(-1)})`);
