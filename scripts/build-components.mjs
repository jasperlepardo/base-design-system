/**
 * build-components.mjs — generate component-tier CSS + TS manifest from every
 * component token file in ctx.paths.componentsDir.
 *
 * A component file may carry a `$component` metadata block:
 *   { name, className, element, colorAxes, sizeAxis, states, stateSelectors, slots, base }
 * If absent, defaults reproduce the Button shape (colorAxes intent/style, sizeAxis
 * size, states rest/hover). `colors` is keyed "<colorAxes joined by '/'>" → state →
 * {bg,text,border}; `sizing` is keyed by size → dimensional vars. Every value is a
 * themed CSS var, so components re-theme across light/dark for free.
 *
 * Emits, per <name>.json:
 *   <outComponentsCss>/<name>.css     base + [data-*] selectors per size/state
 *   <outTs>/<name>.manifest.ts        axis const arrays + <name>Spec (drives M4 Figma)
 *
 * Run: npm run components:build  (after the token build) — or `jspr gen`.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { loadConfig, materializeTokens } from './lib/config.mjs';
import { run as genRaw } from './gen-raw-from-tailwind.mjs';
import { run as buildTokens } from './build-tokens.mjs';

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const isVar = (v) => typeof v === 'string' && v.startsWith('--');
const ref = (v) => (isVar(v) ? `var(${v})` : v);

// Default state → selector-suffix map (interactive, Button-style).
const DEFAULT_STATE_SELECTORS = {
  rest: '',
  hover: ':hover:not(:disabled):not([aria-disabled="true"])',
  focus: ':focus-visible',
  active: ':active',
  disabled: ':disabled, &[aria-disabled="true"]',
};

// Resolve the component's metadata, filling Button-shaped defaults.
export function metaOf(name, file) {
  const m = file.$component ?? {};
  const className = m.className ?? `jspr-${name}`;
  return {
    name: m.name ?? cap(name),
    className,
    prefix: m.prefix ?? className.split('-').pop(),
    element: m.element ?? 'div',
    colorAxes: m.colorAxes ?? ['intent', 'style'],
    sizeAxis: m.sizeAxis ?? 'size',
    states: m.states ?? ['rest', 'hover'],
    stateSelectors: { ...DEFAULT_STATE_SELECTORS, ...(m.stateSelectors ?? {}) },
    slots: m.slots ?? {},
    base: m.base ?? file.base ?? null,
  };
}

// The built-in Button base/focus/disabled/icon rules — used when a component
// declares no `base` block, so the Button output stays byte-identical.
function builtinButtonBase(cn, px) {
  let css = `.${cn} {\n`;
  css += `  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n`;
  css += `  box-sizing: border-box;\n  border: var(--border-width-default) solid var(--${px}-border);\n`;
  css += `  border-radius: var(--${px}-radius);\n  height: var(--${px}-h);\n`;
  css += `  padding-inline: var(--${px}-px);\n  gap: var(--${px}-gap);\n`;
  css += `  font-family: var(--font-family-body), system-ui, sans-serif;\n`;
  css += `  font-size: var(--${px}-fs);\n  line-height: var(--${px}-lh);\n`;
  css += `  font-weight: var(--font-weight-emphasis);\n`;
  css += `  background-color: var(--${px}-bg);\n  color: var(--${px}-text);\n`;
  css += `  cursor: pointer;\n  white-space: nowrap;\n  text-decoration: none;\n`;
  css += `  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;\n}\n\n`;
  css += `.${cn}:focus-visible {\n  outline: 2px solid var(--border-focus);\n  outline-offset: 2px;\n}\n\n`;
  css += `.${cn}:disabled,\n.${cn}[aria-disabled="true"] {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n\n`;
  css += `.${cn}__icon { display: inline-flex; flex: none; }\n\n`;
  return css;
}

// A declared `base` block (CSS property → value map) → a base rule + slot rules.
function declaredBase(cn, base, slots) {
  let css = `.${cn} {\n`;
  for (const [prop, val] of Object.entries(base)) css += `  ${prop}: ${ref(val)};\n`;
  css += `}\n\n`;
  for (const slot of Object.keys(slots))
    css += `.${cn}__${slot} { display: inline-flex; flex: none; }\n`;
  if (Object.keys(slots).length) css += `\n`;
  return css;
}

function buildOne(name, file, valid) {
  const meta = metaOf(name, file);
  const { className: cn, prefix: px } = meta;

  // Validate referenced token vars exist (skip component-internal --<prefix>-* props).
  const missing = new Set();
  const check = (v) => {
    if (isVar(v) && !v.startsWith(`--${px}-`) && !valid.has(v)) missing.add(v);
  };
  for (const combo of Object.values(file.colors ?? {}))
    for (const state of Object.values(combo)) for (const v of Object.values(state)) check(v);
  for (const dim of Object.values(file.sizing ?? {})) for (const v of Object.values(dim)) check(v);
  if (meta.base) for (const v of Object.values(meta.base)) check(v);
  if (missing.size) {
    console.error(`✗ ${name}.json references ${missing.size} unknown CSS var(s):`);
    for (const m of missing) console.error('    ' + m);
    process.exit(1);
  }

  // Derive axis value lists.
  const combos = Object.keys(file.colors ?? {});
  const colorAxisValues = meta.colorAxes.map((_, i) => [
    ...new Set(combos.map((c) => c.split('/')[i])),
  ]);
  const sizes = Object.keys(file.sizing ?? {});

  // --- CSS ---
  let css = `/* Generated by scripts/build-components.mjs — do not edit. */\n\n`;
  css += meta.base ? declaredBase(cn, meta.base, meta.slots) : builtinButtonBase(cn, px);

  // Sizes → custom props on [data-<sizeAxis>="…"].
  for (const size of sizes) {
    const s = file.sizing[size];
    css += `.${cn}[data-${meta.sizeAxis}="${size}"] {\n`;
    css += `  --${px}-h: ${ref(s.height)};\n  --${px}-px: ${ref(s['padding-x'])};\n`;
    css += `  --${px}-gap: ${ref(s.gap)};\n  --${px}-fs: ${ref(s['font-size'])};\n`;
    css += `  --${px}-lh: ${ref(s['line-height'])};\n  --${px}-radius: ${ref(s.radius)};\n}\n\n`;
  }

  // Color combos → color custom props per state.
  for (const combo of combos) {
    const parts = combo.split('/');
    const sel = `.${cn}` + meta.colorAxes.map((ax, i) => `[data-${ax}="${parts[i]}"]`).join('');
    const byState = file.colors[combo];
    for (const state of meta.states) {
      const v = byState[state];
      if (!v) continue;
      const suffix = meta.stateSelectors[state] ?? '';
      css += `${sel}${suffix} {\n  --${px}-bg: ${ref(v.bg)};\n  --${px}-text: ${ref(v.text)};\n  --${px}-border: ${ref(v.border)};\n}\n`;
    }
    css += `\n`;
  }

  // --- TS manifest ---
  const arr = (an, values) =>
    `export const ${an} = [${values.map((v) => `'${v}'`).join(', ')}] as const;\n` +
    `export type ${an[0].toUpperCase()}${an.slice(1, -1)} = (typeof ${an})[number];\n`;

  const axesObj = {};
  let ts = `// Generated by scripts/build-components.mjs — do not edit.\n\n`;
  meta.colorAxes.forEach((ax, i) => {
    ts += arr(`${name}${cap(ax)}s`, colorAxisValues[i]);
    axesObj[ax] = colorAxisValues[i];
  });
  ts += arr(`${name}${cap(meta.sizeAxis)}s`, sizes);
  axesObj[meta.sizeAxis] = sizes;

  const spec = {
    name: meta.name,
    className: cn,
    element: meta.element,
    colorAxes: meta.colorAxes,
    sizeAxis: meta.sizeAxis,
    axes: axesObj,
    states: meta.states,
    slots: meta.slots,
  };
  ts += `\nexport const ${name}Spec = ${JSON.stringify(spec, null, 2)} as const;\n`;

  return { css, ts, meta, sizes, colorAxisValues, combos };
}

export async function run(ctx) {
  const { componentsDir, outTokensCss, outComponentsCss, outTs } = ctx.paths;

  // Set of CSS vars that actually exist (from the generated token CSS).
  const valid = new Set();
  for (const f of readdirSync(outTokensCss).filter((f) => f.endsWith('.css'))) {
    const css = readFileSync(resolve(outTokensCss, f), 'utf8');
    for (const m of css.matchAll(/^\s*(--[a-z0-9-]+):/gim)) valid.add(m[1]);
  }

  mkdirSync(outComponentsCss, { recursive: true });
  mkdirSync(outTs, { recursive: true });

  const files = readdirSync(componentsDir).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const name = basename(f, '.json');
    const file = JSON.parse(readFileSync(join(componentsDir, f), 'utf8'));
    const { css, ts, meta, colorAxisValues, sizes } = buildOne(name, file, valid);
    writeFileSync(join(outComponentsCss, `${name}.css`), css);
    writeFileSync(join(outTs, `${name}.manifest.ts`), ts);
    const dims = [...colorAxisValues.map((v) => v.length), sizes.length].join('×');
    console.log(
      `✓ ${name}: ${dims} (${meta.colorAxes.join('×')}×${meta.sizeAxis}) → ${name}.css + manifest`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ctx = await loadConfig();
  await genRaw(ctx);
  materializeTokens(ctx);
  await buildTokens(ctx);
  await run(ctx);
}
