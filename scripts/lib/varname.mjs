/**
 * varname.mjs — single source of truth for token NAME mapping across surfaces.
 *
 * A token has a path like ['semantic','brand','default']. The same path renders
 * three ways:
 *   - CSS var:    --brand-default      (raw→--raw-*, primitive→--p-*, semantic unprefixed)
 *   - Figma name: brand/default        (tier dropped, '/'-joined) in collection "Semantic"
 *
 * These helpers keep that mapping defined ONCE, so the CSS build (build-tokens),
 * the Figma push (sync/gen-figma-push) and the component generator (M4) agree.
 * Reverse lookups go through buildVarIndex() rather than string-splitting,
 * because segment names themselves contain '-' (e.g. font-family, border-width).
 */

export const TIER_COLLECTION = { raw: 'Raw', primitive: 'Primitive', semantic: 'Semantic' };

/** Token path (incl. tier at [0]) → CSS custom-property name. */
export function cssNameFromPath(path) {
  const [tier, ...rest] = path;
  if (tier === 'raw') return '--' + ['raw', ...rest].join('-');
  if (tier === 'primitive') return '--' + ['p', ...rest].join('-');
  return '--' + rest.join('-'); // semantic: unprefixed
}

/** Token path → { collection, name } for Figma. */
export function figmaFromPath(path) {
  const [tier, ...rest] = path;
  return { collection: TIER_COLLECTION[tier], name: rest.join('/') };
}

/**
 * Build a `--css-var` → { collection, name } index from token leaves.
 * @param leaves array of { path: string[] }
 */
export function buildVarIndex(leaves) {
  const idx = new Map();
  for (const l of leaves) idx.set(cssNameFromPath(l.path), figmaFromPath(l.path));
  return idx;
}
