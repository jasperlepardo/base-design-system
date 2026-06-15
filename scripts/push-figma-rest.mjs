/**
 * push-figma-rest.mjs — headless variable push via the Figma REST Variables API
 * (Enterprise-only). Transforms <outFigma>/variables.json into a single
 * POST /v1/files/:key/variables payload and applies it idempotently:
 * existing collections/modes/variables (matched by name) are reused/UPDATEd,
 * missing ones are CREATEd with tempIds that the API resolves within the request.
 *
 * Without a token (or with --dry-run), writes the payload to
 * <outFigma>/rest-payload.json for inspection instead of calling the API.
 *
 * Env: FIGMA_TOKEN (Variables write scope), FIGMA_FILE_KEY (or --figma-file).
 * Run: jspr gen figma --push variables   (or node scripts/push-figma-rest.mjs)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from './lib/config.mjs';

const API = 'https://api.figma.com/v1';

// Parse GET /variables/local meta into name-keyed lookups (or empty for create-all).
function indexExisting(meta) {
  const colByName = {};
  const modeByCol = {}; // colId → { modeName → modeId }
  const varByCol = {}; // colName → { varName → varId }
  if (!meta) return { colByName, modeByCol, varByCol };
  for (const [id, c] of Object.entries(meta.variableCollections ?? {})) {
    colByName[c.name] = { id, initialModeId: c.defaultModeId };
    modeByCol[id] = {};
    for (const m of c.modes ?? []) modeByCol[id][m.name] = m.modeId;
  }
  for (const c of Object.values(meta.variableCollections ?? {})) varByCol[c.name] ??= {};
  for (const [id, v] of Object.entries(meta.variables ?? {})) {
    const colName = Object.values(meta.variableCollections).find(
      (c) => c.id === v.variableCollectionId,
    )?.name;
    if (colName) (varByCol[colName] ??= {})[v.name] = id;
  }
  return { colByName, modeByCol, varByCol };
}

// Build the REST batch payload from the manifest + existing-state index.
export function buildPayload(manifest, existing) {
  const { colByName, modeByCol, varByCol } = existing;
  const payload = {
    variableCollections: [],
    variableModes: [],
    variables: [],
    variableModeValues: [],
  };
  let seq = 0;
  const tmp = (p) => `tmp_${p}_${seq++}`;

  const colId = {}; // name → real|temp id
  const modeId = {}; // `${col}/${mode}` → real|temp id
  const varId = {}; // `${col}/${name}` → real|temp id
  const stats = { collections: 0, modes: 0, variables: 0, values: 0 };

  for (const col of manifest.collections) {
    const existCol = colByName[col.name];
    if (existCol) {
      colId[col.name] = existCol.id;
      const modes = modeByCol[existCol.id] ?? {};
      col.modes.forEach((mName, i) => {
        if (modes[mName]) {
          modeId[`${col.name}/${mName}`] = modes[mName];
        } else {
          const id = tmp('mode');
          modeId[`${col.name}/${mName}`] = id;
          payload.variableModes.push({
            action: 'CREATE',
            id,
            name: mName,
            variableCollectionId: existCol.id,
          });
          stats.modes++;
        }
      });
    } else {
      const cId = tmp('col');
      colId[col.name] = cId;
      const initialModeId = tmp('mode');
      payload.variableCollections.push({
        action: 'CREATE',
        id: cId,
        name: col.name,
        initialModeId,
      });
      stats.collections++;
      // Name the auto-created first mode; CREATE any additional modes.
      col.modes.forEach((mName, i) => {
        if (i === 0) {
          modeId[`${col.name}/${mName}`] = initialModeId;
          payload.variableModes.push({
            action: 'UPDATE',
            id: initialModeId,
            name: mName,
            variableCollectionId: cId,
          });
        } else {
          const id = tmp('mode');
          modeId[`${col.name}/${mName}`] = id;
          payload.variableModes.push({
            action: 'CREATE',
            id,
            name: mName,
            variableCollectionId: cId,
          });
        }
        stats.modes++;
      });
    }
    // Variables (CREATE missing; reuse existing id).
    for (const v of col.variables) {
      const key = `${col.name}/${v.name}`;
      const existId = varByCol[col.name]?.[v.name];
      if (existId) {
        varId[key] = existId;
      } else {
        const id = tmp('var');
        varId[key] = id;
        payload.variables.push({
          action: 'CREATE',
          id,
          name: v.name,
          variableCollectionId: colId[col.name],
          resolvedType: v.type,
        });
        stats.variables++;
      }
    }
  }

  // Mode values (reference real/temp variable + mode ids; aliases resolve by name).
  const encode = (val) => {
    if (val.alias)
      return { type: 'VARIABLE_ALIAS', id: varId[`${val.alias.collection}/${val.alias.name}`] };
    if (val.color) return val.color;
    if (val.string != null) return val.string;
    return val.number;
  };
  for (const col of manifest.collections) {
    for (const v of col.variables) {
      const vId = varId[`${col.name}/${v.name}`];
      for (const [mode, val] of Object.entries(v.valuesByMode)) {
        payload.variableModeValues.push({
          variableId: vId,
          modeId: modeId[`${col.name}/${mode}`],
          value: encode(val),
        });
        stats.values++;
      }
    }
  }
  return { payload, stats };
}

async function getLocal(fileKey, token) {
  const res = await fetch(`${API}/files/${fileKey}/variables/local`, {
    headers: { 'X-Figma-Token': token },
  });
  if (!res.ok) throw new Error(`GET variables/local ${res.status}: ${await res.text()}`);
  return (await res.json()).meta;
}

async function postVariables(fileKey, token, payload) {
  const res = await fetch(`${API}/files/${fileKey}/variables`, {
    method: 'POST',
    headers: { 'X-Figma-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`POST variables ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function run(ctx, opts = {}) {
  const manifest = JSON.parse(readFileSync(join(ctx.paths.outFigma, 'variables.json'), 'utf8'));
  const token = process.env.FIGMA_TOKEN;
  const fileKey = ctx.figmaFile;

  // Offline / dry: build an all-CREATE payload and write it for inspection.
  if (opts.dryRun || !token || !fileKey) {
    const { payload, stats } = buildPayload(manifest, indexExisting(null));
    const dest = join(ctx.paths.outFigma, 'rest-payload.json');
    writeFileSync(dest, JSON.stringify(payload, null, 2) + '\n');
    const why = !token ? 'no FIGMA_TOKEN' : !fileKey ? 'no file key' : 'dry-run';
    console.log(
      `✓ ${dest} (${why}) — would CREATE ${stats.collections} collections, ${stats.variables} variables, ${stats.values} values`,
    );
    return;
  }

  const existing = indexExisting(await getLocal(fileKey, token));
  const { payload, stats } = buildPayload(manifest, existing);
  await postVariables(fileKey, token, payload);
  console.log(
    `✓ pushed to ${fileKey} — +${stats.collections} collections, +${stats.modes} modes, +${stats.variables} variables, ${stats.values} mode-values`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ctx = await loadConfig({ figmaFile: process.env.FIGMA_FILE_KEY });
  await run(ctx, { dryRun: process.argv.includes('--dry-run') });
}
