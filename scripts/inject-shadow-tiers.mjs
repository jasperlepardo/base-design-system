/**
 * inject-shadow-tiers.mjs — one-time/idempotent: add `shadow` passthrough trees
 * to the hand-authored primitive + shared-semantic token sources, aliasing the
 * decomposed raw shadow parts emitted by gen-raw. Run after `npm run tokens:raw`.
 *
 *   primitive.shadow.{size}.{layer}.{part} → {raw.shadow.…}
 *   semantic.shadow.{size}.{layer}.{part}  → {primitive.shadow.…}
 *
 * Run: node scripts/inject-shadow-tiers.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aliasShadowTree } from './lib/shadow.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const write = (p, o) => writeFileSync(p, JSON.stringify(o, null, 2) + '\n');

const rawPath = join(root, 'tokens/raw.json');
const primPath = join(root, 'tokens/primitives.json');
const semPath = join(root, 'tokens/semantics/shared.json');

const rawShadow = read(rawPath).raw.shadow;
if (!rawShadow) throw new Error('raw.shadow missing — run `npm run tokens:raw` first');

const prim = read(primPath);
prim.primitive.shadow = aliasShadowTree(rawShadow, 'raw');
write(primPath, prim);

const sem = read(semPath);
sem.semantic.shadow = aliasShadowTree(rawShadow, 'primitive');
write(semPath, sem);

const count = (t) => Object.values(t).reduce((n, s) => n + Object.values(s).reduce((m, l) => m + Object.keys(l).length, 0), 0);
console.log(`✓ injected shadow tiers — primitive ${count(prim.primitive.shadow)} parts, semantic ${count(sem.semantic.shadow)} parts`);
