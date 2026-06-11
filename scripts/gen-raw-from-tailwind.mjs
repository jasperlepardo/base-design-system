/**
 * gen-raw-from-tailwind.mjs — derive the RAW color tier from Tailwind's own
 * default palette, so "raw" is literally Tailwind's colors.
 *
 * Tailwind v4 ships its palette as CSS custom properties in the package's
 * `theme.css` (e.g. `--color-red-500: oklch(...)`). We parse those and emit
 * tokens/raw.json as a Style-Dictionary tree:
 *
 *   { "raw": { "color": { "red": { "500": { "value": "oklch(...)", "type": "color" } } } } }
 *
 * Run: npm run tokens:raw  (runs automatically before tokens:build)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Locate Tailwind's theme.css (where the default palette lives in v4).
function findThemeCss() {
  const pkgJson = require.resolve('tailwindcss/package.json');
  const pkgDir = dirname(pkgJson);
  for (const candidate of ['theme.css', 'dist/theme.css', 'lib/theme.css']) {
    const p = resolve(pkgDir, candidate);
    try {
      readFileSync(p, 'utf8');
      return p;
    } catch {
      /* try next */
    }
  }
  throw new Error(
    'Could not find Tailwind theme.css. Is `tailwindcss` v4 installed? (npm install)',
  );
}

const css = readFileSync(findThemeCss(), 'utf8');

// Match `--color-<family>-<shade>: <value>;` and `--color-<black|white>: <value>;`
const shaded = /--color-([a-z]+)-(\d+):\s*([^;]+);/g;
const flat = /--color-(black|white):\s*([^;]+);/g;

const color = {};
let m;
while ((m = shaded.exec(css))) {
  const [, family, shade, value] = m;
  (color[family] ??= {})[shade] = { value: value.trim(), type: 'color' };
}
while ((m = flat.exec(css))) {
  const [, name, value] = m;
  color[name] = { value: value.trim(), type: 'color' };
}

const familyCount = Object.keys(color).length;
if (familyCount === 0) {
  throw new Error('Parsed 0 colors from Tailwind theme.css — the format may have changed.');
}

const out = { raw: { color } };
const dest = resolve(root, 'tokens/raw.json');
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');

const total = Object.values(color).reduce(
  (n, v) => n + (v.value ? 1 : Object.keys(v).length),
  0,
);
console.log(`✓ tokens/raw.json — ${total} Tailwind colors across ${familyCount} families`);
