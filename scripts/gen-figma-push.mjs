/**
 * gen-figma-push.mjs — emit COMPACT self-contained use_figma scripts that
 * create the variable collections from figma/variables.json.
 *
 * Writes figma/push/{raw-N,primitive,semantic}.js. To keep each script small
 * enough for use_figma's code limit, the embedded data carries only names +
 * values; the in-Figma runtime derives the Figma type, scopes, and WEB code
 * syntax from the variable name. Each script is idempotent (skip-existing) and
 * resolves aliases by reading the referenced collection live from the file.
 *
 * Compact value encoding (per entry = [name, value] or [name, valuesByMode]):
 *   color literal   → [r,g,b,a]          (array length 4)
 *   number literal  → 16                 (number)
 *   string literal  → "Inter, ..."       (string)
 *   alias           → {$:[collection,name]}
 *   semantic (modes)→ {L:<val>, D:<val>}  (each <val> is one of the above)
 *
 * Run: node scripts/gen-figma-push.mjs   (after `npm run figma:sync`)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'figma/variables.json'), 'utf8'));
const byName = Object.fromEntries(manifest.collections.map((c) => [c.name, c]));

// Encode one figma value (literal or alias) into the compact form.
function enc(val) {
  if (val.alias) return { $: [val.alias.collection, val.alias.name] };
  if (val.color) {
    const { r, g, b, a } = val.color;
    return [r, g, b, a];
  }
  if (val.string != null) return val.string;
  return val.number;
}

// Single-mode collection → entries [name, encodedValue].
function singleEntries(variables) {
  return variables.map((v) => [v.name, enc(v.valuesByMode.Value)]);
}
// Semantic → entries [name, {L, D}].
function semanticEntries(variables, modes) {
  const [light, dark] = modes;
  return variables.map((v) => [
    v.name,
    { L: enc(v.valuesByMode[light]), D: enc(v.valuesByMode[dark]) },
  ]);
}

// The in-Figma runtime, shared by every emitted script. Derives type/scopes/
// codeSyntax from the variable name; resolves aliases via live lookups.
const RUNTIME = (collectionName, modeNames, aliasCols) => `
const COLLECTION = ${JSON.stringify(collectionName)};
const MODE_NAMES = ${JSON.stringify(modeNames)};
const ALIAS_COLS = ${JSON.stringify(aliasCols)};
const PREFIX = COLLECTION === 'Raw' ? 'raw-' : COLLECTION === 'Primitive' ? 'p-' : '';

function isAlias(v) { return v && typeof v === 'object' && Array.isArray(v.$); }
function figmaType(name, v) {
  if (Array.isArray(v)) return 'COLOR';
  if (isAlias(v)) return null; // resolved from target
  if (typeof v === 'string') return name.includes('font-family') ? 'STRING' : 'STRING';
  return 'FLOAT';
}
function scopeFor(name, type) {
  if (type === 'COLOR') {
    const top = name.split('/')[0];
    if (top === 'background' || top === 'surface') return ['FRAME_FILL', 'SHAPE_FILL'];
    if (top === 'text') return ['TEXT_FILL'];
    if (top === 'border') return ['STROKE_COLOR'];
    return ['ALL_FILLS', 'STROKE_COLOR'];
  }
  if (type === 'STRING') return ['FONT_FAMILY'];
  if (name.includes('radius')) return ['CORNER_RADIUS'];
  if (name.includes('spacing') || name.startsWith('space')) return ['GAP', 'WIDTH_HEIGHT'];
  if (name.includes('font-size')) return ['FONT_SIZE'];
  if (name.includes('line-height')) return ['LINE_HEIGHT'];
  if (name.includes('border-width')) return ['STROKE_FLOAT'];
  if (name.includes('font-weight')) return ['FONT_WEIGHT'];
  return ['WIDTH_HEIGHT', 'GAP'];
}
async function getOrCreateCollection(name, modeNames) {
  const existing = await figma.variables.getLocalVariableCollectionsAsync();
  let col = existing.find((c) => c.name === name);
  if (!col) col = figma.variables.createVariableCollection(name);
  col.renameMode(col.modes[0].modeId, modeNames[0]);
  for (let i = 1; i < modeNames.length; i++)
    if (!col.modes.find((m) => m.name === modeNames[i])) col.addMode(modeNames[i]);
  return col;
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
function applyVal(variable, modeId, v, lookups) {
  if (isAlias(v)) {
    const [c, n] = v.$;
    const target = lookups[c] && lookups[c][n];
    if (!target) throw new Error('Missing alias target: ' + c + '/' + n);
    variable.setValueForMode(modeId, { type: 'VARIABLE_ALIAS', id: target.id });
  } else if (Array.isArray(v)) {
    variable.setValueForMode(modeId, { r: v[0], g: v[1], b: v[2], a: v[3] });
  } else {
    variable.setValueForMode(modeId, v);
  }
}

const col = await getOrCreateCollection(COLLECTION, MODE_NAMES);
const modeIds = MODE_NAMES.map((m) => col.modes.find((x) => x.name === m).modeId);
const own = await mapFor(COLLECTION);
const lookups = { [COLLECTION]: own };
for (const c of ALIAS_COLS) lookups[c] = await mapFor(c);

let created = 0;
function typeOf(name, firstVal) {
  // For aliases, the resolved type must match the alias target's type.
  if (isAlias(firstVal)) {
    const [c, n] = firstVal.$;
    const t = lookups[c] && lookups[c][n];
    return t ? t.resolvedType : 'COLOR';
  }
  return figmaType(name, firstVal);
}
for (const [name, val] of DATA) {
  // Per-mode value list (single-mode collections wrap the bare value).
  const modeVals = MODE_NAMES.length === 1 ? [val] : MODE_NAMES.map((m) => val[m[0]]);
  const type = typeOf(name, modeVals[0]);
  let v = own[name];
  if (!v) {
    v = figma.variables.createVariable(name, col, type);
    own[name] = v;
    created++;
  }
  v.scopes = scopeFor(name, type);
  try { v.setVariableCodeSyntax('WEB', 'var(--' + PREFIX + name.replace(/\\//g, '-') + ')'); } catch (e) {}
  MODE_NAMES.forEach((m, i) => applyVal(v, modeIds[i], modeVals[i], lookups));
}
return { collection: COLLECTION, total: DATA.length, created };
`;

function script(dataLiteral, collectionName, modeNames, aliasCols) {
  return `const DATA = ${dataLiteral};\n` + RUNTIME(collectionName, modeNames, aliasCols);
}

const outDir = resolve(root, 'figma/push');
mkdirSync(outDir, { recursive: true });
const sz = (s) => `${(s.length / 1024).toFixed(1)}KB`;
const write = (file, content, n) => {
  writeFileSync(resolve(outDir, file), content);
  console.log(`✓ figma/push/${file} (${sz(content)}, ${n} vars)`);
};

// Raw — chunked.
const rawEntries = singleEntries(byName.Raw.variables);
const CHUNK = 200;
for (let i = 0, p = 1; i < rawEntries.length; i += CHUNK, p++) {
  const chunk = rawEntries.slice(i, i + CHUNK);
  write(`raw-${p}.js`, script(JSON.stringify(chunk), 'Raw', ['Value'], []), chunk.length);
}
// Primitive — aliases into Raw.
const primEntries = singleEntries(byName.Primitive.variables);
write('primitive.js', script(JSON.stringify(primEntries), 'Primitive', ['Value'], ['Raw']), primEntries.length);
// Semantic — Light/Dark, aliases into Primitive (+ Raw for shared dims).
const semEntries = semanticEntries(byName.Semantic.variables, byName.Semantic.modes);
write(
  'semantic.js',
  script(JSON.stringify(semEntries), 'Semantic', byName.Semantic.modes, ['Raw', 'Primitive']),
  semEntries.length,
);
