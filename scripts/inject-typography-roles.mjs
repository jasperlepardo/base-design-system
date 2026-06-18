/**
 * inject-typography-roles.mjs — add coupled semantic typography roles
 * (display / heading / body × sizes) to the shared-semantic source. Each role
 * couples font-size + line-height, aliasing the flat PRIMITIVE scale. Weight +
 * family come from the existing semantic font-weight/font-family roles (applied
 * in the Figma text styles, not duplicated as variables).
 *
 * Additive — leaves the existing semantic font-size/line-height scale intact
 * (components still consume --font-size-md etc.).
 *
 * Run: node scripts/inject-typography-roles.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const semPath = join(root, 'tokens/semantics/shared.json');

// role → scale step (xs…9xl)
const ROLES = {
  display: { lg: '6xl', md: '5xl', sm: '4xl' },
  heading: { h1: '3xl', h2: '2xl', h3: 'xl', h4: 'lg', h5: 'base', h6: 'sm' },
  body: { lg: 'lg', md: 'base', sm: 'sm', xs: 'xs' },
};

const dimRef = (group, step) => ({ value: `{primitive.${group}.${step}}`, type: 'dimension' });

const sem = JSON.parse(readFileSync(semPath, 'utf8'));
for (const [role, sizes] of Object.entries(ROLES)) {
  sem.semantic[role] = {};
  for (const [size, step] of Object.entries(sizes)) {
    sem.semantic[role][size] = {
      'font-size': dimRef('font-size', step),
      'line-height': dimRef('line-height', step),
    };
  }
}
writeFileSync(semPath, JSON.stringify(sem, null, 2) + '\n');
const n = Object.values(ROLES).reduce((a, s) => a + Object.keys(s).length, 0);
console.log(`✓ injected ${n} typography roles (×2 props = ${n * 2} semantic vars): display/heading/body`);
