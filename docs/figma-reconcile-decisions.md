# Code ↔ Figma reconciliation — decisions log

Reconciling the **code** token system (source of truth, Tailwind-aligned) against the
**JSPR-Tokens** Figma (`4A0TgVbwojrRl48lG0GeBu`, the older BDO-origin library), segment
by segment. Default resolution where Tailwind settles it: **code wins → the Figma is
regenerated/pushed from code.** Implementation is batched at the end (before publish).

## RAW tier

### color — ✅ done (code wins)
- neutral palette → true neutral (not slate). Done in code.
- alpha → keep the **derived clean ramp** (`a050…a900` = 5–90%), on **all 28 families**; coexists with Tailwind `/opacity` modifiers. Figma's custom Radix alpha is superseded.
- families → keep **28** (incl. `mauve/olive/mist/taupe` — they're in this project's Tailwind). Figma gains the 4 it's missing on regen.
- naming → lowercase `color/*` (Tailwind/CSS). Figma's `Color/*` corrected on regen.

### spacing — ✅ done (code wins)
- `spacing/{step}` (Tailwind steps × `--spacing` multiplier; rem in code, px in Figma). Figma's `Sizing/{px}` regenerates to this.

### radius — ✅ done (code wins)
- own named `radius/*` scale, 3-tier (Tailwind `--radius-*`, separate from spacing). Figma's `Rounded→Sizing` regenerates.

### typography — decided (impl pending)
- **font-family** → brand: **sans = Inter, serif = Georgia, mono = JetBrains Mono**.
  - **code** = full stack *with fallbacks* (`'Inter', ui-sans-serif, system-ui, …`).
  - **Figma** = **bare primary name** only (`Inter`) — Figma font vars hold one real family.
  - impl: (1) wire a brand-font source so raw emits Inter+fallbacks (same gap as the
    spacing multiplier — `gen-raw` reads Tailwind's *default*, not base's `@theme`); (2)
    `sync-figma` font-family literal → emit the first font of the stack, quotes stripped.
- **font-weight** → code wins: named `thin…black` (Figma's numeric naming regenerates).
- **font-size** → code wins: named `xs…9xl` (Figma's px-keyed `Text/*` regenerates).
- **grouping** → code wins: separate `font-family` vs `font-weight` groups (Figma lumps both in `Font`).
- **line-height / leading** → code wins (Tailwind has both `--leading-*` + per-size line-heights).
- **semantic typography** → lean **code's curated roles** (`font-family: body/heading`,
  `weight: body/emphasis/heading`, size `xs…4xl`) over Figma's passthrough — consistent
  with the spacing/color "roles at semantic" decisions. *(not yet explicitly confirmed)*

### shadow — decided
- Shadows are composite → **can't be Figma variables** (Figma uses **effect styles**; the file has one, `Shadow/Default`). Code keeps Tailwind's 8 box-shadows as authoritative. **Exclude shadow from the variable sync.**
- **Decision: shadows are TOKENS, full 3-tier decomposition (option B).** A shadow can't be one Figma variable, so decompose each layer into parts and tokenize the parts raw → primitive → semantic; an **effect style** (`Shadow/2xs … 2xl`, `Shadow/inner`) composes them by **binding** each part to the semantic variable. **Deferred — do later.**
- Shape per shadow layer: `offset-x`, `offset-y`, `blur`, `spread` → **FLOAT** vars; `color` → **COLOR** var. Multi-layer shadows (`sm/md/lg/xl` = 2 layers) get parts per layer. Shadow colors are black-at-alpha → reuse the existing `black/a*` 3-tier tokens for the color part.
- Source: `tokens/raw.json` → `raw.shadow.{2xs,xs,sm,md,lg,xl,2xl,inner}` (`type: "shadow"`, from Tailwind `--shadow-*`) → CSS `--raw-shadow-*`. Deferred generator: parse box-shadow (comma = layer; `[inset] x y [blur] [spread] color`; `inner` → `INNER_SHADOW`), emit decomposed part tokens (raw/primitive/semantic), then create effect styles binding parts to the semantic vars (`gen-figma-effects` + use_figma).

### layout — decided
- Figma's `Layout` is a **custom design-canvas grid** (screens 375–1920, column widths, 12-col grid/gutter) — **no CSS-token equivalent → leave Figma-only**.
- Separate gap: Tailwind's `--breakpoint-*` + `--container-*` aren't in code's raw. **Decision: add them to code's raw** (be truly "raw = literally Tailwind"). impl in backlog.

## PRIMITIVE tier — ✅ done
- color role-ramps: lowercase, `neutral` (not `Default`), white/black via `neutral.0/1000`, alpha stays at raw only → **code wins, no change**.
- **`info` removed** (primitive + semantic + `@theme`) — unused by components, absent in Figma.
- **typography now 3-tier**: added `primitive.{font-family,font-size,font-weight,line-height}` passthrough; semantic re-points onto them (`--font-size-md → --p-font-size-base → raw`). Matches spacing/radius + the Figma's `Text/Font/Leading` primitives.
- spacing/radius primitives already 3-tier — match.
- Figma's `Layout` primitive = canvas grid → Figma-only (see raw/layout).

## Pending segments (to diff next)
- **Semantic** tier — the big one: `bg/fg/text/border` color families + the `fg/*` tier (partly in `figma-token-diff.md`), plus spacing/radius/type semantics (decided)

## Figma alignment approach (decided)
- Do **one full in-place alignment** of the existing collections (`01 Raw`/`02 Primitives`/`03 Semantics`) **after all tiers are reconciled** in code — NOT a parallel/duplicate collection.
- In-place = rename/remap existing variables to match code + add code's new ones; **renaming preserves each variable ID so the linked Components file keeps its bindings.** Script it and review before running.

## Implementation backlog (batch before publish)
- font-family brand fonts (raw source + Figma bare-name).
- `scripts/lib/color.mjs` 4-decimal rounding — currently uncommitted on `main`.
- Regenerate/push the Figma library from code (the actual code→Figma sync).
- Release the pending package version (PR #49 / v0.9.7 + subsequent).
