#!/usr/bin/env node
/**
 * jspr — design-system CLI. The consuming repo is the source of truth: it
 * provides jspr.config.{js,mjs,json} (token overrides) and runs this to
 * generate token/@theme CSS, TS manifests, and the Figma library.
 *
 *   jspr gen [tokens|figma|components|all]   (default: all)
 *     --config <path>  --out <dir>  --figma-file <key>  --dry-run
 *   jspr pull figma [--write] [--file <key>]   (M6)
 *
 * Subcommands import each step's run(ctx) — one config resolution, one temp dir.
 */
import { loadConfig, materializeTokens, cleanTmp } from '../scripts/lib/config.mjs';
import { run as genRaw } from '../scripts/gen-raw-from-tailwind.mjs';
import { run as buildTokens } from '../scripts/build-tokens.mjs';
import { run as buildComponents } from '../scripts/build-components.mjs';
import { run as syncFigma } from '../scripts/sync-figma.mjs';
import { run as genFigmaPush } from '../scripts/gen-figma-push.mjs';
import { run as genFigmaComponents } from '../scripts/gen-figma-components.mjs';
import { run as pushFigmaRest } from '../scripts/push-figma-rest.mjs';
import { run as pullFigma } from '../scripts/pull-figma.mjs';

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) flags[key] = true;
      else flags[key] = argv[++i];
    } else positional.push(a);
  }
  return { positional, flags };
}

function usage() {
  console.log(`jspr — design system generator

Usage:
  jspr gen [tokens|figma|components|all]   generate from jspr.config (default: all)
  jspr pull figma [--write]                pull Figma variable edits → jspr.config (M6)

Flags:
  --config <path>     explicit jspr.config location
  --out <dir>         output root override
  --figma-file <key>  target Figma file key
  --dry-run           resolve + merge, write nothing
`);
}

// Resolve the token graph once (gen raw from Tailwind + materialize overrides).
let prepared = false;
async function prepareTokens(ctx) {
  if (prepared) return;
  await genRaw(ctx);
  materializeTokens(ctx);
  prepared = true;
}
async function genTokens(ctx) {
  await prepareTokens(ctx);
  await buildTokens(ctx);
  await buildComponents(ctx);
}
async function genFigma(ctx) {
  await prepareTokens(ctx);
  await syncFigma(ctx);
  await genFigmaPush(ctx);
  await genFigmaComponents(ctx);
}

const { positional, flags } = parseArgs(process.argv.slice(2));
const [command = 'gen', target = 'all'] = positional;

if (flags.help || flags.h || command === 'help') {
  usage();
  process.exit(0);
}

const ctx = await loadConfig({
  configPath: typeof flags.config === 'string' ? flags.config : undefined,
  out: typeof flags.out === 'string' ? flags.out : undefined,
  figmaFile: typeof flags['figma-file'] === 'string' ? flags['figma-file'] : undefined,
});

if (flags['dry-run']) {
  console.log('jspr dry-run — resolved context:');
  console.log(
    JSON.stringify(
      { overrides: ctx.overrides, paths: ctx.paths, figmaFile: ctx.figmaFile },
      null,
      2,
    ),
  );
  process.exit(0);
}

try {
  if (command === 'gen') {
    if (!['tokens', 'components', 'figma', 'all'].includes(target)) {
      console.error(`Unknown gen target: ${target}`);
      usage();
      process.exit(2);
    }
    if (target === 'tokens') await genTokens(ctx);
    else if (target === 'components') await buildComponents(ctx);
    else if (target === 'figma') await genFigma(ctx);
    else if (target === 'all') {
      await genTokens(ctx);
      await genFigma(ctx);
    }
    // Optional headless REST push of variables (Enterprise).
    const push = typeof flags.push === 'string' ? flags.push : flags.push ? 'all' : null;
    if (push && (push === 'all' || push.includes('variable'))) {
      await pushFigmaRest(ctx, { dryRun: !!flags['dry-run'] });
    }
  } else if (command === 'pull') {
    if (target !== 'figma') {
      console.error(`Unknown pull target: ${target} (expected: figma)`);
      process.exit(2);
    }
    await pullFigma(ctx, {
      write: !!flags.write,
      from: typeof flags.from === 'string' ? flags.from : null,
    });
  } else {
    console.error(`Unknown command: ${command}`);
    usage();
    process.exit(2);
  }
} finally {
  cleanTmp(ctx);
}
