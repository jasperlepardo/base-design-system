/**
 * gen-figma-components.mjs — emit deterministic use_figma scripts that build
 * Figma component sets from the component token files, binding every visual
 * property to the variables created by the variable push (sync/gen-figma-push).
 *
 * For each component it writes one script per component SET under
 *   <outFigma>/components/<name>/<setName>.js
 * Variables MUST exist first (run figma/push/* before these). Each script:
 *   - switches to/creates the component's page (once),
 *   - builds a live name→variable map per collection (like gen-figma-push),
 *   - creates one component per variant cell (intent×style×size×state), binding
 *     fills/strokes/padding/gap/radius/font-size to variables by NAME,
 *   - combineAsVariants() into a set, grid-lays the cells, adds a TEXT label
 *     property (best-effort), and returns created node IDs.
 *
 * The variant matrix is capped at ~30 per set: the largest axes are peeled off
 * as "split" axes (one set per split combo) until the remainder fits.
 *
 * Run: node scripts/gen-figma-components.mjs   (after `jspr gen figma`)
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { loadConfig, materializeTokens } from './lib/config.mjs';
import { metaOf } from './build-components.mjs';

const MAX_CELLS = 30;
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// Build a `--css-var` → { c: collection, n: name } index from variables.json.
// Forward (figma name → css var) is unambiguous: only '/' becomes '-'.
function buildIndex(manifest) {
  const PREFIX = { Raw: 'raw-', Primitive: 'p-', Semantic: '' };
  const idx = new Map();
  for (const col of manifest.collections)
    for (const v of col.variables)
      idx.set('--' + PREFIX[col.name] + v.name.replaceAll('/', '-'), { c: col.name, n: v.name });
  return idx;
}

// css var ref → {c,n} | null  (null for 'transparent' / literals / unknown)
const refOf = (idx, v) =>
  typeof v === 'string' && v.startsWith('--') ? (idx.get(v) ?? null) : null;

const cartesian = (axes) =>
  axes.reduce(
    (acc, ax) => acc.flatMap((row) => ax.values.map((val) => [...row, [ax.key, val]])),
    [[]],
  );

// Peel the largest axes into `split` until the remaining product ≤ MAX_CELLS.
function splitAxes(axes) {
  const remaining = [...axes];
  const split = [];
  const product = (a) => a.reduce((n, x) => n * x.values.length, 1);
  while (product(remaining) > MAX_CELLS && remaining.length > 1) {
    remaining.sort((a, b) => b.values.length - a.values.length);
    split.push(remaining.shift());
  }
  return { split, remaining };
}

// The in-Figma runtime shared by every emitted component script.
const RUNTIME = `
async function getOrCreatePage(name) {
  let pg = figma.root.children.find((p) => p.name === name);
  if (!pg) { pg = figma.createPage(); pg.name = name; }
  await figma.setCurrentPageAsync(pg);
  return pg;
}
async function mapFor(colName) {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const col = cols.find((c) => c.name === colName);
  const map = {};
  if (!col) return map;
  const vars = await Promise.all(col.variableIds.map((id) => figma.variables.getVariableByIdAsync(id)));
  for (const v of vars) if (v) map[v.name] = v;
  return map;
}
function lk(ref) { return ref ? (LOOKUPS[ref.c] && LOOKUPS[ref.c][ref.n]) || null : null; }
function bindFill(node, ref) {
  const v = lk(ref);
  if (!v) { node.fills = []; return; }
  const p = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
  node.fills = [figma.variables.setBoundVariableForPaint(p, 'color', v)];
}
function bindStroke(node, ref) {
  const v = lk(ref);
  if (!v) { node.strokes = []; return; }
  const p = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } };
  node.strokes = [figma.variables.setBoundVariableForPaint(p, 'color', v)];
}
function bindDim(node, field, ref) { const v = lk(ref); if (v) try { node.setBoundVariable(field, v); } catch (e) {} }

const LOOKUPS = {};
for (const c of ALIAS_COLS) LOOKUPS[c] = await mapFor(c);
const page = await getOrCreatePage(PAGE);

let FONT = { family: 'Inter', style: 'Medium' };
try { await figma.loadFontAsync(FONT); }
catch (e) { const fs = await figma.listAvailableFontsAsync(); FONT = fs[0].fontName; await figma.loadFontAsync(FONT); }

const variants = [];
for (const cell of CELLS) {
  const c = figma.createComponent();
  c.name = cell.props;
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisSizingMode = 'AUTO';
  c.counterAxisSizingMode = 'AUTO';
  c.primaryAxisAlignItems = 'CENTER';
  c.counterAxisAlignItems = 'CENTER';
  if (cell.padX) { bindDim(c, 'paddingLeft', cell.padX); bindDim(c, 'paddingRight', cell.padX); }
  if (cell.gap) bindDim(c, 'itemSpacing', cell.gap);
  if (cell.radius) for (const f of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) bindDim(c, f, cell.radius);
  bindFill(c, cell.bg);
  bindStroke(c, cell.border);
  if (cell.strokeWeight) bindDim(c, 'strokeWeight', cell.strokeWeight);

  const t = figma.createText();
  t.fontName = FONT;
  t.characters = LABEL;
  if (cell.fs) bindDim(t, 'fontSize', cell.fs);
  bindFill(t, cell.text);
  c.appendChild(t);
  variants.push(c);
}

const set = figma.combineAsVariants(variants, page);
set.name = SET_NAME;
// Grid layout for readability.
const COLS = GRID_COLS;
const GAP = 24;
let maxW = 0, maxH = 0;
for (const v of set.children) { maxW = Math.max(maxW, v.width); maxH = Math.max(maxH, v.height); }
set.children.forEach((v, i) => {
  v.x = (i % COLS) * (maxW + GAP);
  v.y = Math.floor(i / COLS) * (maxH + GAP);
});

// Best-effort TEXT label property bound to each variant's text node.
try {
  const propId = set.addComponentProperty('Label', 'TEXT', LABEL);
  for (const v of set.children) {
    const txt = v.findChild((n) => n.type === 'TEXT');
    if (txt) txt.componentPropertyReferences = { ...(txt.componentPropertyReferences || {}), characters: propId };
  }
} catch (e) {}

return { componentSet: set.id, variants: variants.length, name: SET_NAME };
`;

function emitScript({ pageName, setName, cells, aliasCols, gridCols, label }) {
  const header =
    `const PAGE = ${JSON.stringify(pageName)};\n` +
    `const SET_NAME = ${JSON.stringify(setName)};\n` +
    `const LABEL = ${JSON.stringify(label)};\n` +
    `const GRID_COLS = ${gridCols};\n` +
    `const ALIAS_COLS = ${JSON.stringify(aliasCols)};\n` +
    `const CELLS = ${JSON.stringify(cells)};\n`;
  return header + RUNTIME;
}

function buildComponent(name, file, idx) {
  const meta = metaOf(name, file);
  const colors = file.colors ?? {};
  const sizing = file.sizing ?? {};
  const sizes = Object.keys(sizing);
  const combos = Object.keys(colors);
  const states = meta.states.length ? meta.states : ['rest'];

  // Variant axes: each colorAxis, the size axis, and (if >1) a State axis.
  const colorAxisValues = meta.colorAxes.map((_, i) => [
    ...new Set(combos.map((c) => c.split('/')[i])),
  ]);
  const axes = [
    ...meta.colorAxes.map((k, i) => ({ key: k, values: colorAxisValues[i] })),
    { key: meta.sizeAxis, values: sizes },
  ];
  if (states.length > 1) axes.push({ key: 'state', values: states });

  const { split, remaining } = splitAxes(axes);

  // Resolve one cell's bindings from its full coordinate (Map of axis→value).
  const cellFor = (coord) => {
    const combo = meta.colorAxes.map((k) => coord[k]).join('/');
    const size = coord[meta.sizeAxis];
    const state = coord.state ?? states[0];
    const cv = colors[combo]?.[state] ?? {};
    const sv = sizing[size] ?? {};
    const props = Object.entries(coord)
      .map(([k, v]) => `${cap(k)}=${v}`)
      .join(', ');
    return {
      props,
      bg: refOf(idx, cv.bg),
      text: refOf(idx, cv.text),
      border: refOf(idx, cv.border),
      padX: refOf(idx, sv['padding-x']),
      gap: refOf(idx, sv.gap),
      radius: refOf(idx, sv.radius),
      fs: refOf(idx, sv['font-size']),
      strokeWeight: refOf(idx, '--border-width-default'),
    };
  };

  const scripts = [];
  const splitCombos = split.length ? cartesian(split) : [[]];
  for (const sc of splitCombos) {
    const fixed = Object.fromEntries(sc);
    const rows = cartesian(remaining);
    const cells = rows.map((row) => cellFor({ ...fixed, ...Object.fromEntries(row) }));
    // Only the collections this set actually binds to (for live mapFor).
    const aliasCols = [
      ...new Set(
        cells.flatMap((c) =>
          [c.bg, c.text, c.border, c.padX, c.gap, c.radius, c.fs, c.strokeWeight]
            .filter(Boolean)
            .map((r) => r.c),
        ),
      ),
    ];
    const suffix = sc.map(([, v]) => v).join('-');
    const setName = suffix ? `${meta.name}/${suffix}` : meta.name;
    const file = suffix ? `${name}__${suffix}.js` : `${name}.js`;
    const gridCols = remaining[0] ? remaining[0].values.length : Math.ceil(Math.sqrt(cells.length));
    scripts.push({
      file,
      content: emitScript({
        pageName: meta.name,
        setName,
        cells,
        aliasCols,
        gridCols,
        label: meta.name,
      }),
    });
  }
  return { meta, scripts, axes, split };
}

export async function run(ctx) {
  const manifestPath = join(ctx.paths.outFigma, 'variables.json');
  const idx = buildIndex(JSON.parse(readFileSync(manifestPath, 'utf8')));

  const compDir = ctx.paths.componentsDir;
  const files = readdirSync(compDir).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const name = basename(f, '.json');
    const file = JSON.parse(readFileSync(join(compDir, f), 'utf8'));
    const { meta, scripts, split } = buildComponent(name, file, idx);
    const outDir = join(ctx.paths.outFigma, 'components', name);
    mkdirSync(outDir, { recursive: true });
    for (const s of scripts) writeFileSync(join(outDir, s.file), s.content);
    const note = split.length ? ` (split by ${split.map((a) => a.key).join(', ')})` : '';
    console.log(`✓ ${meta.name}: ${scripts.length} component-set script(s) → ${outDir}${note}`);
  }
  console.log('  Run figma/push/* (variables) FIRST, then these via use_figma.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ctx = await loadConfig();
  materializeTokens(ctx);
  await run(ctx);
}
