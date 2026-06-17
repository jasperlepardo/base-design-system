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
 * Evaluate a single-operator CSS calc() to a NUMBER (Figma has no calc()).
 *   'calc(1 / 0.75)'        → 1.3333  (unitless ratio, e.g. line-height)
 *   'calc(2.5 / 2.25)'      → 1.1111
 *   'calc(infinity * 1px)'  → 9999    (radius full → Figma's large-radius sentinel)
 * rem operands are scaled by remRoot; px/unitless pass through. Returns NaN if
 * the expression isn't a simple `a <op> b`.
 */
function evalCalc(expr, remRoot) {
  const inner = expr.slice(5, -1).trim(); // strip calc( … )
  if (/\binfinity\b/i.test(inner)) return 9999;
  const m = inner.match(/^([\d.]+)(px|rem)?\s*([*/+-])\s*([\d.]+)(px|rem)?$/);
  if (!m) return NaN;
  const [, a, ua, op, b, ub] = m;
  const num = (v, u) => (u === 'rem' ? parseFloat(v) * remRoot : parseFloat(v));
  const x = num(a, ua),
    y = num(b, ub);
  const r = op === '*' ? x * y : op === '/' ? x / y : op === '+' ? x + y : x - y;
  return +r.toFixed(4);
}

/**
 * Convert a CSS dimension string to a px NUMBER for a Figma FLOAT variable.
 *   '0.25rem'        → 4        (rem × remRoot)
 *   '12px'           → 12
 *   '0px'/'0'        → 0
 *   '9999'           → 9999     (unitless, e.g. font-weight 600)
 *   'calc(1 / 0.75)' → 1.3333   (unitless ratio — line-height)
 *   'calc(infinity * 1px)' → 9999
 */
export function dimToPx(value, remRoot = DEFAULT_REM_ROOT) {
  const s = String(value).trim();
  if (s.startsWith('calc(')) {
    const c = evalCalc(s, remRoot);
    if (!Number.isNaN(c)) return c;
  }
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  if (s.endsWith('rem')) return +(n * remRoot).toFixed(4);
  return n; // px, unitless, or bare number
}
