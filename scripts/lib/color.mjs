/**
 * color.mjs — convert CSS color strings (oklch / hex / rgb) to Figma's
 * { r, g, b, a } floats (0..1). Tailwind v4 ships its palette as oklch, which
 * Figma variables can't store directly, so we convert at sync time.
 */

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

// oklch → linear sRGB → gamma-encoded sRGB. Standard Björn Ottosson matrices.
function oklchToRgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const enc = (x) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return clamp01(v);
  };
  return { r: enc(lr), g: enc(lg), b: enc(lb) };
}

function parseOklch(str) {
  // oklch(62.3% 0.214 259.815 [ / 0.5 ])
  const m = str.match(
    /oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/i,
  );
  if (!m) return null;
  const pct = (v, base) => (v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v) / base);
  const L = m[1].endsWith('%') ? parseFloat(m[1]) / 100 : parseFloat(m[1]);
  const C = parseFloat(m[2]); // chroma is already absolute
  const H = parseFloat(m[3]);
  const a = m[4] == null ? 1 : pct(m[4], 1);
  return { ...oklchToRgb(L, C, H), a };
}

function parseHex(str) {
  let h = str.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 && h.length !== 8) return null;
  const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
}

function parseRgb(str) {
  const m = str.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)/i);
  if (!m) return null;
  const a = m[4] == null ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  return { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a };
}

/** Parse any supported CSS color string to Figma { r, g, b, a } floats. */
export function cssColorToFigma(str) {
  const s = String(str).trim();
  let c = null;
  if (s.startsWith('oklch')) c = parseOklch(s);
  else if (s.startsWith('#')) c = parseHex(s);
  else if (s.startsWith('rgb')) c = parseRgb(s);
  else if (s === 'white') c = { r: 1, g: 1, b: 1, a: 1 };
  else if (s === 'black') c = { r: 0, g: 0, b: 0, a: 1 };
  else if (s === 'transparent') c = { r: 0, g: 0, b: 0, a: 0 };
  if (!c) return null;
  // 8-bit color needs ~3 decimals; 4 is ample. Keeps Figma payloads small.
  const r4 = (n) => Math.round(n * 1e4) / 1e4;
  return { r: r4(c.r), g: r4(c.g), b: r4(c.b), a: r4(c.a) };
}
