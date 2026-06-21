/**
 * gen-semantic-color.mjs — (one-shot) rewrite the semantic color layer to the
 * bg/fg/text/border mechanism, generated from the live Figma Color/* state.
 * Replaces the background/surface/text/border/intent groups in light.json/dark.json
 * with semantic.color.{bg,fg,text,border}, aliasing the primitive (and raw) tokens.
 *
 * Run: node scripts/gen-semantic-color.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// { "group/key": { l: ref, d: ref } } captured from Figma
const DATA = JSON.parse(readFileSync(join(root, 'tokens/_figma-semantic-color.json'), 'utf8'));

function tree(mode) {
  const out = { color: { bg: {}, fg: {}, text: {}, border: {} } };
  for (const [k, v] of Object.entries(DATA)) {
    const i = k.indexOf('/');
    const group = k.slice(0, i),
      key = k.slice(i + 1);
    if (!out.color[group]) out.color[group] = {};
    // transparent has no raw token in code — use the CSS keyword literal
    const value = v[mode] === '{raw.color.white.transparent}' ? 'transparent' : v[mode];
    out.color[group][key] = { value, type: 'color' };
  }
  return out;
}

for (const [file, mode] of [['light', 'l'], ['dark', 'd']]) {
  const p = join(root, `tokens/semantics/${file}.json`);
  writeFileSync(p, JSON.stringify({ semantic: tree(mode) }, null, 2) + '\n');
}
console.log(`✓ rewrote light.json + dark.json semantic.color (${Object.keys(DATA).length} tokens × bg/fg/text/border)`);
