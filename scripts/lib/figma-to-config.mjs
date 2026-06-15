/**
 * figma-to-config.mjs — reverse-map a pulled Figma variable manifest back into
 * jspr.config overrides (the Figma→code direction).
 *
 * Both inputs use the sync-figma manifest shape:
 *   { collections: [{ name, modes, variables: [{ name, type, valuesByMode }] }] }
 * where a value is { alias: { collection, name } } or a literal. We diff the
 * pulled tree against the current (base+config) tree and emit a granular overlay:
 *   roles      — Primitive color/<role>/<shade> alias retargeted to another family
 *   semantics  — Semantic <role>/<slot> alias retargeted to another primitive shade
 * Reverse mapping is lossy: it recovers granular per-shade overrides, collapsing
 * to the `roles: { x: 'family' }` shorthand only when an entire role moved as one.
 */
import { deepMerge } from './merge.mjs';

const byColName = (m) => {
  const o = {};
  for (const c of m.collections) {
    o[c.name] = {};
    for (const v of c.variables) o[c.name][v.name] = v;
  }
  return o;
};

const aliasName = (v, mode = 'Value') => {
  const val = v?.valuesByMode?.[mode];
  return val && val.alias ? val.alias.name : null;
};

/** Diff pulled vs base manifests → a jspr.config overlay ({ roles?, semantics? }). */
export function diffToConfig(base, pulled) {
  const B = byColName(base);
  const P = byColName(pulled);
  const overlay = {};

  // --- roles (Primitive color/<role>/<shade> → Raw color/<fam>/<shade>) ---
  const roleShades = {}; // role → { shade → { fam, shade } }
  for (const name of Object.keys(P.Primitive ?? {})) {
    const m = name.match(/^color\/([^/]+)\/(.+)$/);
    if (!m) continue;
    const [, role, shade] = m;
    const pt = aliasName(P.Primitive[name]);
    const bt = aliasName(B.Primitive?.[name]);
    if (pt && pt !== bt) {
      const fm = pt.match(/^color\/([^/]+)\/(.+)$/);
      if (fm) (roleShades[role] ??= {})[shade] = { fam: fm[1], shade: fm[2] };
    }
  }
  if (Object.keys(roleShades).length) {
    overlay.roles = {};
    for (const [role, shades] of Object.entries(roleShades)) {
      const entries = Object.entries(shades);
      const fams = new Set(entries.map(([, x]) => x.fam));
      const sameShade = entries.every(([sh, x]) => x.shade === sh);
      if (fams.size === 1 && sameShade)
        overlay.roles[role] = [...fams][0]; // whole-family shorthand
      else {
        overlay.roles[role] = {};
        for (const [sh, x] of entries) overlay.roles[role][sh] = `{${x.fam}.${x.shade}}`;
      }
    }
  }

  // --- semantics (Semantic <role>/<slot> → Primitive color/<role>/<shade>) ---
  const sem = {};
  for (const name of Object.keys(P.Semantic ?? {})) {
    const pv = P.Semantic[name];
    if (pv.type !== 'COLOR') continue;
    const m = name.match(/^([^/]+)\/(.+)$/);
    if (!m) continue;
    const [, role, slot] = m;
    for (const [mode, key] of [
      ['Light', 'light'],
      ['Dark', 'dark'],
    ]) {
      const pt = aliasName(pv, mode);
      const bt = aliasName(B.Semantic?.[name], mode);
      if (pt && pt !== bt) {
        const sm = pt.match(/^color\/[^/]+\/(.+)$/);
        if (sm)
          ((sem[key] ??= {})[role] ??= {})[slot] = /^\d+$/.test(sm[1]) ? Number(sm[1]) : sm[1];
      }
    }
  }
  if (Object.keys(sem).length) overlay.semantics = sem;

  return overlay;
}

/** Human-readable one-line-per-change summary of an overlay. */
export function summarize(overlay) {
  const lines = [];
  for (const [role, v] of Object.entries(overlay.roles ?? {}))
    lines.push(
      typeof v === 'string' ? `roles.${role} → ${v}` : `roles.${role} → ${JSON.stringify(v)}`,
    );
  for (const [mode, roles] of Object.entries(overlay.semantics ?? {}))
    for (const [role, slots] of Object.entries(roles))
      for (const [slot, val] of Object.entries(slots))
        lines.push(`semantics.${mode}.${role}.${slot} → ${val}`);
  return lines;
}

/** Merge overlay into an existing config object and serialize as an ESM module. */
export function serializeConfig(existing, overlay) {
  const merged = deepMerge(existing ?? {}, overlay);
  return (
    `// jspr.config.js — updated by \`jspr pull figma --write\`.\n` +
    `// Review via git diff; re-add any dynamic (process.env) values if needed.\n` +
    `export default ${JSON.stringify(merged, null, 2)};\n`
  );
}
