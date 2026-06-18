/**
 * inject-primitive-alpha.mjs — add the alpha ramp to primitive color families,
 * aliasing the raw alpha ramp. (Supersedes the earlier "alpha at raw only"
 * decision — alpha is now also surfaced at the primitive tier.)
 *
 *   primitive.color.{neutral,primary,success,warning,danger}.{a050..a900}
 *     → {raw.color.{neutral,blue,green,amber,red}.aNNN}
 *
 * Run: node scripts/inject-primitive-alpha.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const primPath = join(root, 'tokens/primitives.json');
const RAW_FAMILY = { neutral: 'neutral', primary: 'blue', success: 'green', warning: 'amber', danger: 'red', white: 'white', black: 'black' };
const ALPHA = ['a050', 'a100', 'a150', 'a200', 'a300', 'a400', 'a500', 'a600', 'a700', 'a800', 'a900'];

const prim = JSON.parse(readFileSync(primPath, 'utf8'));
let added = 0;
for (const [fam, rawFam] of Object.entries(RAW_FAMILY)) {
  prim.primitive.color[fam] ??= {}; // white/black are alpha-only families
  for (const a of ALPHA) {
    prim.primitive.color[fam][a] = { value: `{raw.color.${rawFam}.${a}}`, type: 'color' };
    added++;
  }
}
writeFileSync(primPath, JSON.stringify(prim, null, 2) + '\n');
console.log(`✓ injected ${added} primitive alpha tokens (${Object.keys(RAW_FAMILY).length} families × ${ALPHA.length})`);
