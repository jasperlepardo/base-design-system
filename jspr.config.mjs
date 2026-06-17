/**
 * jspr.config.mjs — base (JSPR) design-system config.
 *
 * Only sets brand fonts for now: code emits the full CSS stack (with fallbacks);
 * the Figma push uses the first family (a Figma font variable holds one real
 * family). `fonts` is NOT a token override, so the dev build still writes to the
 * package's normal paths (no temp dir).
 */
export default {
  fonts: {
    sans: "'Inter', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
    serif: "'Georgia', ui-serif, Cambria, 'Times New Roman', Times, serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
};
