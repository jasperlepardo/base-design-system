/**
 * merge.mjs — deep-merge + config-shorthand compilers for the jspr token layer.
 *
 * A consumer's jspr.config.js expresses overrides at every tier. The compilers
 * here turn its ergonomic shorthands (role → Tailwind family, shade-number
 * semantics, {fam.shade} sugar) into the Style-Dictionary tree shape, and
 * deepMerge() layers those overlays over the base token JSON shipped in the
 * package. The merged tree is the single source for BOTH CSS and Figma.
 */

export const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const isLeaf = (v) => isPlainObject(v) && 'value' in v && 'type' in v;

/**
 * Deep-merge `overlay` over `base`. Objects merge recursively; a leaf
 * ({value,type}) or a non-object replaces; `null` deletes the key.
 */
export function deepMerge(base, overlay) {
  if (!isPlainObject(base) || !isPlainObject(overlay) || isLeaf(overlay)) return overlay;
  const out = { ...base };
  for (const [k, v] of Object.entries(overlay)) {
    if (v === null) {
      delete out[k];
    } else if (k in out) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// Infer a Style-Dictionary token type from its top-level group name.
export function inferType(group) {
  if (group === 'color') return 'color';
  if (group === 'font-family') return 'fontFamily';
  if (group === 'font-weight') return 'fontWeight';
  return 'dimension';
}

// {red.700} → {raw.color.red.700}; full {raw.*} refs and literals pass through.
function expandColorRef(v) {
  if (typeof v !== 'string') return v;
  if (/^\{(raw|primitive|semantic)\./.test(v)) return v;
  const m = v.match(/^\{([a-z0-9-]+)\.([a-z0-9]+)\}$/i);
  return m ? `{raw.color.${m[1]}.${m[2]}}` : v; // else hex / oklch literal
}

// {spacing.5} → {raw.spacing.5}; full refs and literals pass through.
function expandDimRef(v) {
  if (typeof v !== 'string') return v;
  if (/^\{(raw|primitive|semantic)\./.test(v)) return v;
  const m = v.match(/^\{([a-z0-9-]+)\.(.+)\}$/i);
  return m ? `{raw.${m[1]}.${m[2]}}` : v;
}

const asLeaf = (value, type) => (isLeaf(value) ? value : { value, type });

/**
 * roles → primitive.color overlay. A role value is either a Tailwind family
 * string ('red' ⇒ whole ramp follows red) or an object { base?, <shade>: ref }.
 * Shade keys are taken from the BASE role so the ramp stays in lockstep.
 *
 * @param basePrimitiveColor base.primitive.color  (role → { shade → leaf })
 * @returns overlay subtree to merge under `primitive` (i.e. { color: {...} })
 */
export function compileRoles(basePrimitiveColor = {}, roles = {}) {
  const color = {};
  for (const [role, spec] of Object.entries(roles)) {
    const shadeKeys = Object.keys(basePrimitiveColor[role] ?? {});
    const out = {};
    if (typeof spec === 'string') {
      for (const s of shadeKeys) out[s] = { value: `{raw.color.${spec}.${s}}`, type: 'color' };
    } else if (isPlainObject(spec)) {
      if (spec.base)
        for (const s of shadeKeys)
          out[s] = { value: `{raw.color.${spec.base}.${s}}`, type: 'color' };
      for (const [k, v] of Object.entries(spec)) {
        if (k === 'base') continue;
        out[k] = { value: expandColorRef(v), type: 'color' };
      }
    }
    color[role] = out;
  }
  return { color };
}

/**
 * semantics.{light,dark} overlay. A slot value may be a shade number/string
 * (⇒ alias into that role's primitive shade), a {ref}, or a full leaf.
 * @returns overlay subtree to merge under `semantic`
 */
export function compileSemanticColors(group = {}) {
  const out = {};
  for (const [role, slots] of Object.entries(group)) {
    out[role] = {};
    for (const [slot, v] of Object.entries(slots)) {
      if (isLeaf(v)) out[role][slot] = v;
      else if (typeof v === 'number' || /^\d+$/.test(String(v)))
        out[role][slot] = { value: `{primitive.color.${role}.${v}}`, type: 'color' };
      else out[role][slot] = { value: expandColorRef(v), type: 'color' };
    }
  }
  return out;
}

/**
 * Generic dimensional overlay (scale / semantics.shared groups). String leaves
 * are wrapped + sugar-expanded; existing leaves pass through.
 * @returns overlay subtree to merge under `semantic`
 */
export function compileScale(scale = {}) {
  const out = {};
  for (const [group, entries] of Object.entries(scale)) {
    out[group] = {};
    for (const [k, v] of Object.entries(entries)) {
      out[group][k] = asLeaf(typeof v === 'string' ? expandDimRef(v) : v, inferType(group));
    }
  }
  return out;
}

/** raw overlay: wrap bare string leaves with an inferred type by group. */
export function compileRaw(raw = {}) {
  const out = {};
  for (const [group, entries] of Object.entries(raw)) {
    out[group] = {};
    for (const [k, v] of Object.entries(entries)) {
      out[group][k] = asLeaf(v, inferType(group));
    }
  }
  return out;
}
