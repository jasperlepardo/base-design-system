/**
 * units.mjs — spacing/dimension unit helpers shared by token + Figma generation.
 *
 * Code keeps spacing/radius/type in rem (Tailwind-native, scales with root
 * font-size). Figma has no rem, so dimension variables are materialised in px.
 * `remRoot` is the assumed CSS root font-size (default 16) used to convert.
 */

const DEFAULT_REM_ROOT = 16;

/**
 * Normalize a multiplier string to a rem NUMBER.
 *   '5px'      → 5 / remRoot   (e.g. 0.3125)
 *   '0.25rem'  → 0.25
 *   '0.25'     → 0.25          (unitless → treated as rem, like Tailwind --spacing)
 */
export function toRem(value, remRoot = DEFAULT_REM_ROOT) {
  const s = String(value).trim();
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  if (s.endsWith('px')) return n / remRoot;
  return n; // 'rem' or unitless
}

/**
 * Convert a CSS dimension string to a px NUMBER for a Figma FLOAT variable.
 *   '0.25rem' → 4        (rem × remRoot)
 *   '12px'    → 12
 *   '0px'/'0' → 0
 *   '9999'    → 9999     (unitless, e.g. radius full; font-weight 600)
 */
export function dimToPx(value, remRoot = DEFAULT_REM_ROOT) {
  const s = String(value).trim();
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  if (s.endsWith('rem')) return +(n * remRoot).toFixed(4);
  return n; // px, unitless, or bare number
}
