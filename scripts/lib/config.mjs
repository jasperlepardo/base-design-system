/**
 * config.mjs — resolve WHAT to read and WHERE to write, for both this package
 * (dev flow) and a consuming repo (`npx jspr`).
 *
 * loadConfig() discovers a jspr.config.{js,mjs,json} in the cwd, merges it over
 * defaults, and computes absolute input/output paths. When the config carries
 * token overrides, materializeTokens() deep-merges the consumer overlays over
 * the package's base token JSON into a temp dir, which every downstream script
 * then reads — so CSS and Figma derive from ONE resolved tree.
 *
 * With NO config (this repo's `npm run tokens`), paths fall back to today's
 * exact locations and no temp dir is used → byte-identical output.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import {
  deepMerge,
  compileRoles,
  compileSemanticColors,
  compileScale,
  compileRaw,
} from './merge.mjs';

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const DEFAULTS = { out: { css: 'src/styles', ts: 'src/tokens/generated', figma: 'figma' } };

// Cheap stable hash for a per-cwd temp dir name (no Date/random needed).
function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));

async function discoverConfig(cwd, explicit) {
  const candidates = explicit
    ? [resolve(cwd, explicit)]
    : ['jspr.config.js', 'jspr.config.mjs', 'jspr.config.json'].map((f) => join(cwd, f));
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    if (p.endsWith('.json')) return readJSON(p);
    const mod = await import(pathToFileURL(p).href);
    return mod.default ?? mod;
  }
  return {};
}

const hasTokenOverrides = (c) =>
  !!(c.roles || c.semantics || c.scale || c.raw || c.components?.dir);

/**
 * @param {{ configPath?: string, cwd?: string, out?: string, figmaFile?: string }} opts
 */
export async function loadConfig(opts = {}) {
  const cwd = opts.cwd ? resolve(opts.cwd) : process.cwd();
  const userConfig = await discoverConfig(cwd, opts.configPath);
  const config = {
    ...DEFAULTS,
    ...userConfig,
    out: { ...DEFAULTS.out, ...(userConfig.out || {}) },
  };

  const overrides = hasTokenOverrides(config);
  const baseTokensDir = join(pkgRoot, 'tokens');
  const tmpDir = join(tmpdir(), `jspr-${hash(cwd)}`);

  const tokensDir = overrides ? tmpDir : baseTokensDir;
  const outRoot = opts.out ? resolve(cwd, opts.out) : cwd;

  const paths = {
    pkgRoot,
    cwd,
    baseTokensDir,
    tmpDir,
    tokensDir, // raw.json, primitives.json, semantics/*  read from here
    rawJsonPath: join(tokensDir, 'raw.json'),
    componentsDir: join(tokensDir, 'components'),
    userComponentsDir: config.components?.dir ? resolve(cwd, config.components.dir) : null,
    outTokensCss: resolve(outRoot, config.out.css, 'tokens'),
    outComponentsCss: resolve(outRoot, config.out.css, 'components'),
    outTs: resolve(outRoot, config.out.ts),
    outFigma: resolve(outRoot, config.out.figma),
  };

  const figmaFile = opts.figmaFile || config.figma?.fileKey || process.env.FIGMA_FILE_KEY || null;

  return { cwd, pkgRoot, config, overrides, paths, figmaFile };
}

/**
 * When the config has token overrides, write the deep-merged token tree into
 * ctx.paths.tmpDir. Assumes raw.json has already been generated at
 * ctx.paths.rawJsonPath (the temp copy) by gen-raw-from-tailwind.
 */
export function materializeTokens(ctx) {
  if (!ctx.overrides) return; // base dev flow reads package tokens directly
  const { baseTokensDir, tmpDir, rawJsonPath } = ctx.paths;
  const { config } = ctx;
  mkdirSync(join(tmpDir, 'semantics'), { recursive: true });
  mkdirSync(join(tmpDir, 'components'), { recursive: true });

  // raw: temp copy (from gen-raw) + optional config.raw overlay
  let raw = readJSON(rawJsonPath);
  if (config.raw) raw = deepMerge(raw, { raw: compileRaw(config.raw) });
  writeFileSync(rawJsonPath, JSON.stringify(raw, null, 2) + '\n');

  // primitives: base + compiled roles
  let primitives = readJSON(join(baseTokensDir, 'primitives.json'));
  if (config.roles)
    primitives = deepMerge(primitives, {
      primitive: compileRoles(primitives.primitive.color, config.roles),
    });
  writeFileSync(join(tmpDir, 'primitives.json'), JSON.stringify(primitives, null, 2) + '\n');

  // semantics: shared + per-theme, with scale + semantic-color overlays
  const sem = config.semantics || {};
  const overlays = {
    shared: compileScale({ ...(config.scale || {}), ...(sem.shared || {}) }),
    light: compileSemanticColors(sem.light || {}),
    dark: compileSemanticColors(sem.dark || {}),
  };
  for (const name of ['shared', 'light', 'dark']) {
    let tree = readJSON(join(baseTokensDir, 'semantics', `${name}.json`));
    if (Object.keys(overlays[name]).length) tree = deepMerge(tree, { semantic: overlays[name] });
    writeFileSync(join(tmpDir, 'semantics', `${name}.json`), JSON.stringify(tree, null, 2) + '\n');
  }

  // components: base files, then deep-merge consumer files by filename
  const baseCompDir = join(baseTokensDir, 'components');
  const merged = {};
  for (const f of readdirSync(baseCompDir).filter((f) => f.endsWith('.json')))
    merged[f] = readJSON(join(baseCompDir, f));
  if (ctx.paths.userComponentsDir && existsSync(ctx.paths.userComponentsDir))
    for (const f of readdirSync(ctx.paths.userComponentsDir).filter((f) => f.endsWith('.json')))
      merged[f] =
        f in merged
          ? deepMerge(merged[f], readJSON(join(ctx.paths.userComponentsDir, f)))
          : readJSON(join(ctx.paths.userComponentsDir, f));
  for (const [f, tree] of Object.entries(merged))
    writeFileSync(join(tmpDir, 'components', f), JSON.stringify(tree, null, 2) + '\n');
}

export function cleanTmp(ctx) {
  if (ctx.overrides) rmSync(ctx.paths.tmpDir, { recursive: true, force: true });
}
