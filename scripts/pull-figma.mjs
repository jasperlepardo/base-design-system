/**
 * pull-figma.mjs — Figma → code. Reverse-maps a designer's variable edits back
 * into jspr.config (code stays the source of truth; pull = a proposed config edit).
 *
 * Read path (any plan): emits figma/pull/read-variables.js — run it via the
 * use_figma MCP, save the returned JSON, then `jspr pull figma --write --from <json>`.
 * Read path (Enterprise): if FIGMA_TOKEN + file key are set, GET variables/local
 * directly. Either way, the pulled manifest is diffed against the current
 * variables.json and granular overrides are written into jspr.config.js.
 *
 * Run: jspr pull figma [--write] [--from <json>] [--figma-file <key>]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig } from './lib/config.mjs';
import { diffToConfig, summarize, serializeConfig } from './lib/figma-to-config.mjs';

const API = 'https://api.figma.com/v1';

// use_figma script that returns the local variables in the manifest shape.
const READ_SCRIPT = `
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const allById = {};
for (const c of cols)
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) allById[id] = { v, col: c.name };
  }
const aliasName = (id) => (allById[id] ? { collection: allById[id].col, name: allById[id].v.name } : null);
const out = { collections: [] };
for (const c of cols) {
  const modeById = {};
  for (const m of c.modes) modeById[m.modeId] = m.name;
  const variables = [];
  for (const id of c.variableIds) {
    const v = allById[id].v;
    const valuesByMode = {};
    for (const [modeId, val] of Object.entries(v.valuesByMode)) {
      const mn = modeById[modeId];
      if (val && val.type === 'VARIABLE_ALIAS') { const a = aliasName(val.id); valuesByMode[mn] = a ? { alias: a } : null; }
      else if (val && typeof val === 'object' && 'r' in val) valuesByMode[mn] = { color: val };
      else if (typeof val === 'string') valuesByMode[mn] = { string: val };
      else valuesByMode[mn] = { number: val };
    }
    variables.push({ name: v.name, type: v.resolvedType, valuesByMode });
  }
  out.collections.push({ name: c.name, modes: c.modes.map((m) => m.name), variables });
}
return out;
`;

function emitReadScript(ctx) {
  const dir = join(ctx.paths.outFigma, 'pull');
  mkdirSync(dir, { recursive: true });
  const dest = join(dir, 'read-variables.js');
  writeFileSync(dest, READ_SCRIPT.trimStart());
  return dest;
}

// Enterprise REST: GET local variables → manifest shape (aliases resolved to names).
async function restGetManifest(fileKey, token) {
  const res = await fetch(`${API}/files/${fileKey}/variables/local`, {
    headers: { 'X-Figma-Token': token },
  });
  if (!res.ok) throw new Error(`GET variables/local ${res.status}: ${await res.text()}`);
  const meta = (await res.json()).meta;
  const colById = {};
  for (const c of Object.values(meta.variableCollections)) colById[c.id] = c;
  const varById = meta.variables;
  const nameOf = (id) => {
    const v = varById[id];
    return v ? { collection: colById[v.variableCollectionId].name, name: v.name } : null;
  };
  const collections = Object.values(meta.variableCollections).map((c) => {
    const modeName = Object.fromEntries(c.modes.map((m) => [m.modeId, m.name]));
    const variables = Object.values(varById)
      .filter((v) => v.variableCollectionId === c.id)
      .map((v) => {
        const valuesByMode = {};
        for (const [modeId, val] of Object.entries(v.valuesByMode)) {
          const mn = modeName[modeId];
          if (val && val.type === 'VARIABLE_ALIAS') {
            const a = nameOf(val.id);
            valuesByMode[mn] = a ? { alias: a } : null;
          } else if (val && typeof val === 'object' && 'r' in val)
            valuesByMode[mn] = { color: val };
          else if (typeof val === 'string') valuesByMode[mn] = { string: val };
          else valuesByMode[mn] = { number: val };
        }
        return { name: v.name, type: v.resolvedType, valuesByMode };
      });
    return { name: c.name, modes: c.modes.map((m) => m.name), variables };
  });
  return { collections };
}

async function loadRawConfig(cwd) {
  for (const f of ['jspr.config.js', 'jspr.config.mjs', 'jspr.config.json']) {
    const p = join(cwd, f);
    if (!existsSync(p)) continue;
    if (p.endsWith('.json')) return { path: p, config: JSON.parse(readFileSync(p, 'utf8')) };
    const mod = await import(pathToFileURL(p).href);
    return { path: p, config: mod.default ?? mod };
  }
  return { path: join(cwd, 'jspr.config.js'), config: {} };
}

export async function run(ctx, opts = {}) {
  const basePath = join(ctx.paths.outFigma, 'variables.json');
  if (!existsSync(basePath)) {
    console.error(
      `✗ ${basePath} not found — run \`jspr gen figma\` first (it's the comparison base).`,
    );
    process.exit(2);
  }
  const base = JSON.parse(readFileSync(basePath, 'utf8'));

  // Obtain the pulled manifest.
  let pulled = null;
  if (opts.from) {
    pulled = JSON.parse(readFileSync(opts.from, 'utf8'));
  } else if (process.env.FIGMA_TOKEN && ctx.figmaFile) {
    pulled = await restGetManifest(ctx.figmaFile, process.env.FIGMA_TOKEN);
  } else {
    const dest = emitReadScript(ctx);
    console.log(`✓ ${dest}`);
    console.log('  Run it via the Figma MCP (use_figma), save the returned JSON, then:');
    console.log('    jspr pull figma --write --from <saved.json>');
    return;
  }

  const overlay = diffToConfig(base, pulled);
  const lines = summarize(overlay);
  if (!lines.length) {
    console.log('✓ Figma matches code — no changes to pull.');
    return;
  }
  console.log(`Pulled ${lines.length} change(s) from Figma:`);
  for (const l of lines) console.log('  ~ ' + l);

  if (!opts.write) {
    console.log('\nRe-run with --write to apply these to jspr.config.js.');
    return;
  }
  const { path, config } = await loadRawConfig(ctx.cwd);
  if (path.endsWith('.json')) {
    const merged = JSON.parse(
      serializeConfig(config, overlay).match(/export default ([\s\S]*);\n$/)[1],
    );
    writeFileSync(path, JSON.stringify(merged, null, 2) + '\n');
  } else {
    writeFileSync(path, serializeConfig(config, overlay));
  }
  console.log(`\n✓ ${path} updated. Review via git diff, then \`jspr gen\`.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const flag = (n) => args.includes(`--${n}`);
  const val = (n) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : null;
  };
  const ctx = await loadConfig({ figmaFile: process.env.FIGMA_FILE_KEY });
  await run(ctx, { write: flag('write'), from: val('from') });
}
