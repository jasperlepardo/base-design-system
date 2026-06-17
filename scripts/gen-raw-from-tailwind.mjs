/**
 * gen-raw-from-tailwind.mjs — derive the entire RAW tier from Tailwind's own
 * default theme, so "raw" is literally Tailwind: colors, spacing, radius,
 * typography (font family/size/weight, line-height, tracking) and shadows.
 *
 * Tailwind v4 ships its theme as CSS custom properties in the package's
 * `theme.css`. We parse those and emit raw.json as a Style-Dictionary tree.
 * Tailwind is resolved from the CONSUMER's repo (their palette), falling back to
 * this package's own install for the dev flow. Output path comes from the ctx.
 *
 * Run: npm run tokens:raw  (or `jspr gen tokens`)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { loadConfig } from './lib/config.mjs';
import { toRem } from './lib/units.mjs';

// Locate Tailwind's theme.css (where the default theme lives in v4), resolving
// from the consumer cwd first so their installed Tailwind wins.
function findThemeCss(cwd) {
  const require = createRequire(join(cwd, 'package.json'));
  const pkgDir = dirname(require.resolve('tailwindcss/package.json'));
  for (const candidate of ['theme.css', 'dist/theme.css', 'lib/theme.css']) {
    const p = join(pkgDir, candidate);
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

const clean = (v) => v.replace(/\s+/g, ' ').trim();
const dim = (value) => ({ value, type: 'dimension' });
const node = (value, type) => ({ value, type });

export async function run(ctx) {
  const css = readFileSync(findThemeCss(ctx.cwd), 'utf8');

  // Pull every `--<prefix>-<key>: <value>;` declaration into { key: value }.
  // Anchored + `m` flag so e.g. `--shadow-` can't match inside `--text-shadow-`.
  function collect(prefix, keyPattern = '[a-z0-9]+') {
    const re = new RegExp(`^\\s*--${prefix}-(${keyPattern}):\\s*([^;]+);`, 'gm');
    const out = {};
    let m;
    while ((m = re.exec(css))) out[m[1]] = clean(m[2]);
    return out;
  }

  /* ---- color (all families + black/white) ---- */
  const color = {};
  {
    const shaded = /^\s*--color-([a-z]+)-(\d+):\s*([^;]+);/gm;
    const flat = /^\s*--color-(black|white):\s*([^;]+);/gm;
    let m;
    while ((m = shaded.exec(css))) (color[m[1]] ??= {})[m[2]] = node(clean(m[3]), 'color');
    while ((m = flat.exec(css))) color[m[1]] = node(clean(m[2]), 'color');
  }
  const familyCount = Object.keys(color).length;
  if (familyCount === 0)
    throw new Error('Parsed 0 colors from Tailwind theme.css — the format may have changed.');

  /* ---- spacing (v4 ships a single --spacing multiplier; materialise steps) ---- */
  const SPACING_STEPS = [
    0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44,
    48, 52, 56, 60, 64, 72, 80, 96,
  ];
  const spacing = { 0: dim('0px'), px: dim('1px') };
  {
    // Multiplier precedence: jspr.config spacing.multiplier > Tailwind --spacing > 0.25rem.
    const baseMatch = css.match(/^\s*--spacing:\s*([^;]+);/m);
    const tailwindMult = baseMatch ? baseMatch[1] : '0.25rem';
    const remRoot = ctx?.spacing?.remRoot ?? 16;
    const baseRem = toRem(ctx?.spacing?.multiplier ?? tailwindMult, remRoot);
    // Tailwind's fractional steps (0.5/1.5/…) use a dot in the class name; keep
    // the token key CSS-safe by writing the dot as "_" (→ --raw-spacing-0_5).
    for (const step of SPACING_STEPS) {
      const key = String(step).replace('.', '_');
      spacing[key] = dim(`${+(step * baseRem).toFixed(4)}rem`);
    }
  }

  /* ---- radius (+ none/full, which Tailwind expresses as utilities) ---- */
  const radius = { none: dim('0px') };
  for (const [k, v] of Object.entries(collect('radius'))) radius[k] = dim(v);
  radius.full = dim('calc(infinity * 1px)');

  /* ---- border width (Tailwind has no theme vars — these are its utilities) ---- */
  const borderWidth = { 0: dim('0px'), 1: dim('1px'), 2: dim('2px'), 4: dim('4px'), 8: dim('8px') };

  /* ---- typography ---- */
  const fontFamily = Object.fromEntries(
    Object.entries(collect('font', 'sans|serif|mono')).map(([k, v]) => [k, node(v, 'fontFamily')]),
  );
  const fontWeight = Object.fromEntries(
    Object.entries(collect('font-weight', '[a-z]+')).map(([k, v]) => [k, node(v, 'fontWeight')]),
  );
  const fontSize = Object.fromEntries(Object.entries(collect('text')).map(([k, v]) => [k, dim(v)]));
  const lineHeight = {};
  {
    const re = /^\s*--text-([a-z0-9]+)--line-height:\s*([^;]+);/gm;
    let m;
    while ((m = re.exec(css))) lineHeight[m[1]] = dim(clean(m[2]));
  }
  const leading = Object.fromEntries(
    Object.entries(collect('leading', '[a-z]+')).map(([k, v]) => [k, dim(v)]),
  );
  const tracking = Object.fromEntries(
    Object.entries(collect('tracking', '[a-z]+')).map(([k, v]) => [k, dim(v)]),
  );

  /* ---- shadows ---- */
  const shadow = Object.fromEntries(
    Object.entries(collect('shadow')).map(([k, v]) => [k, node(v, 'shadow')]),
  );

  const out = {
    raw: {
      color,
      spacing,
      radius,
      'border-width': borderWidth,
      'font-family': fontFamily,
      'font-size': fontSize,
      'font-weight': fontWeight,
      'line-height': lineHeight,
      leading,
      tracking,
      shadow,
    },
  };

  const dest = ctx.paths.rawJsonPath;
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, JSON.stringify(out, null, 2) + '\n');

  const count = (o) =>
    Object.values(o).reduce((n, v) => n + (v.value ? 1 : Object.keys(v).length), 0);
  console.log(
    `✓ raw.json — from Tailwind: ${count(color)} colors (${familyCount} families), ` +
      `${count(spacing)} spacing, ${count(radius)} radius, ${count(fontSize)} font-size, ` +
      `${count(lineHeight)} line-height, ${count(fontWeight)} font-weight, ${count(shadow)} shadow`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run(await loadConfig());
}
