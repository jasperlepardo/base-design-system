/**
 * release.mjs — start a release under the PR-based flow.
 *
 * `main` is protected (PRs + passing CI required), so we can't bump + push to it
 * directly. Instead this:
 *   1. bumps the version in package.json (no git tag),
 *   2. commits it on a `release/vX.Y.Z` branch,
 *   3. pushes and opens a PR.
 *
 * Merge that PR once CI passes — the Release workflow (.github/workflows/release.yml)
 * then tags `vX.Y.Z`, creates the GitHub Release, and publishes to GitHub Packages.
 *
 * Usage: node scripts/release.mjs <patch|minor|major>
 * (via `npm run release:patch` etc.)
 */
import { execSync } from 'node:child_process';

const type = process.argv[2];
if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('Usage: node scripts/release.mjs <patch|minor|major>');
  process.exit(1);
}

const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();
const sh = (cmd) => execSync(cmd, { stdio: 'inherit' });

if (out('git status --porcelain')) {
  console.error('✗ Working tree not clean — commit or stash first.');
  process.exit(1);
}
const branch = out('git rev-parse --abbrev-ref HEAD');
if (branch !== 'main') {
  console.error(`✗ Run from main (currently on "${branch}").`);
  process.exit(1);
}

sh('git fetch origin main --quiet');
if (out('git rev-list HEAD..origin/main --count') !== '0') {
  console.error('✗ Local main is behind origin/main — pull first.');
  process.exit(1);
}

// Bump in the working tree (no tag); the tag is created post-merge by CI.
const version = out(`npm version ${type} --no-git-tag-version`); // "vX.Y.Z"
const rel = `release/${version}`;

sh(`git checkout -b ${rel}`);
sh('git add package.json package-lock.json');
sh(`git commit -m "Release ${version}"`);
sh(`git push -u origin ${rel}`);
sh(
  `gh pr create --base main --head ${rel} --title "Release ${version}" ` +
    `--body "Automated version bump to ${version}.\\n\\nMerging this tags ${version}, creates the GitHub Release, and publishes to GitHub Packages via the Release workflow."`,
);

console.log(`\n✓ Opened release PR for ${version}.`);
console.log('  Merge it once CI passes — tagging, release, and publish run automatically.');
console.log('  (Switch back with: git checkout main)');
