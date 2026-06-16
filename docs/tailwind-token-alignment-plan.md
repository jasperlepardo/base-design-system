# Plan — align base's semantic tokens with the JSPR-Tokens Figma, the Tailwind way

## Goal
Expand base's semantic layer to cover the JSPR-Tokens Figma library
(`4A0TgVbwojrRl48lG0GeBu`) — **values and roles** — while staying **Tailwind-native**:
roles, not per-property duplicates; one palette; themed via the cascade.

## Principles (the "right based on Tailwind" rules)
1. **Tokens are roles, not properties.** One `--color-*` in `@theme` yields
   `bg-*`, `text-*`, `border-*`, `fill-*`, `ring-*`. So the Figma's parallel
   `bg/ · fg/ · text/ · border/` families collapse to **one role token each** in
   code. We do **not** port the `fg/*` tier or the bg/text duplicates — that
   split is a Figma per-property-binding limitation, not real tokens.
2. **One Tailwind palette, by the scale.** Neutral = Tailwind **neutral** (not
   slate); intents alias whole Tailwind ramps (blue/green/amber/red); shades
   follow Tailwind/Figma (surface 0/50/100/200/400; intent 600; subtle 100;
   border 500). Matches the Figma because the Figma is just stock Tailwind.
3. **Keep base's real dark theme.** base flips values per theme in
   `theme-{light,dark}.css` (e.g. heading 900→50, intent 600→500, subtle 50→950).
   The Figma's modes are flat (Light = Dark) — that's the *incomplete* side; every
   new/re-pointed token gets a proper light **and** dark value following base's
   existing inversion convention.
4. **Extend base's naming, don't import Figma's families.** Components already use
   `--{role}-{variant}` (e.g. `--primary-default`, `--background-muted`) and
   `@theme` already maps them to `--color-*`. We extend that set; the jspr
   code↔Figma sync maps roles via the existing varname layer (no need to rename
   to `bg/`·`fg/`).

---

## 1. Primitive change — neutral palette
`tokens/primitives.json`: re-point the whole `primitive.color.neutral.*` ramp
**`{raw.color.slate.N}` → `{raw.color.neutral.N}`** (both ramps already exist in
`raw.json`). One change; fixes every neutral row in the diff at once. `0`/`1000`
(white/black) unchanged.

## 2. Semantic target spec
`tokens/semantics/{light,dark}.json`. **R** = re-point existing token, **N** = new
token. Dark values follow base's inversion convention (verified against current
`theme-dark.css`).

### Surfaces — `background.*` (utilities `bg-canvas*` via `@theme`)
| token | role (Figma) | light | dark | |
|---|---|---|---|---|
| `background.default` | bg/default | neutral-0 | neutral-950 | ok |
| `background.subtle` | bg/secondary | neutral-50 | neutral-900 | ok |
| `background.muted` | bg/neutral-subtle | neutral-100 | neutral-800 | ok |
| `background.strong` | **bg/tertiary** | neutral-**200** | neutral-700 | **N** |
| `background.stronger` | **bg/quarternary** | neutral-**400** | neutral-600 | **N** |
| `background.disabled` | bg/disabled | neutral-**400** | neutral-700 | **R** (100→400) |
| `background.inverse` | bg/default-solid | neutral-900 | neutral-100 | **N** |
| `background.inverse-secondary` | bg/secondary-solid | neutral-800 | neutral-200 | **N** |

### Content — `text.*` (also drives icon color; utilities `text-*`)
| token | role | light | dark | |
|---|---|---|---|---|
| `text.heading` | text/heading | neutral-900 | neutral-50 | ok |
| `text.body` | text/body | neutral-**800** | neutral-100 | **R** (700→800) |
| `text.muted` | text/muted | neutral-**700** | neutral-300 | **R** (500→700) |
| `text.caption` | text/caption + placeholder | neutral-**600** | neutral-400 | **N** |
| `text.disabled` | text/disabled | neutral-400 | neutral-600 | ok |
| `text.inverse` | text/heading_on-primary | neutral-0 | neutral-950 | ok |
| `text.on-primary-muted` | text/body_on-primary | white α80 | white α80 | **N** |
| `text.on-primary-subtle` | text/muted_on-primary | white α64 | white α64 | **N** |
| `text.heading-brand` | text/heading_brand | primary-800 | primary-300 | **N** |

> `text/{intent}` + `text/{intent}_hover` are **not** separate tokens — they equal
> `--{intent}-default` / `--{intent}-hover`, reached via `text-primary` etc. No new tokens.

### Lines — `border.*` (utilities `border-*`)
| token | role | light | dark | |
|---|---|---|---|---|
| `border.default` | border/default | neutral-200 | neutral-800 | ok |
| `border.subtle` | — | neutral-100 | neutral-900 | ok |
| `border.strong` | — | neutral-300 | neutral-700 | ok |
| `border.disabled` | border/disabled | neutral-**400** | neutral-600 | **R** (200→400) |
| `border.focus` | (a11y) | primary-500 | primary-400 | ok |

### Intents — `{primary,success,warning,danger}.*` (utilities `bg-primary`, `text-primary`, `border-primary`, …)
Per intent (showing primary; success/warning/danger identical shades except
warning text-on flips dark):
| token | role | light | dark | |
|---|---|---|---|---|
| `{intent}.default` | bg/fg/text {intent} | **600** | 500 | ok¹ |
| `{intent}.hover` | {intent}_hover | **700** | 400 | ok¹ |
| `{intent}.subtle` | {intent}-subtle | **100** | 950 | **R** (50→100) |
| `{intent}.subtle-hover` | {intent}-subtle_hover | **200** | 900 | **N** |
| `{intent}.subtle-fg` | (ghost text) | 700 | 100/200 | ok |
| `{intent}.border` | border/{intent} | **500** | 400 | **R** (100→500) |
| `{intent}.border-subtle` | border/{intent}_subtle | **300** | 700 | **N** |
| `{intent}.on` | on-{intent} | neutral-0 | neutral-0² | ok |

¹ **warning is a re-point**: `default` 500→**600**, `hover` 600→**700** (light).
² warning `on` = neutral-950 (dark text on amber), both themes — unchanged.

### White / Black intents (Badge/Button already use raw `--p-color-neutral-0/1000`)
Add `white.subtle` (white α32) and `black.subtle` (black α32) **N** only if a
component needs the Figma's `*_subtle` alphas; otherwise skip — keep using the raw
neutrals (already correct).

**Count:** ~**15 re-points** + ~**18 new role tokens** (vs the diff's "70 missing",
which counted Figma's redundant per-property duplicates).

## 3. `@theme` exposure (`src/styles/theme.css`)
Add `--color-*` aliases for every new role so Tailwind generates utilities:
```
--color-canvas-strong:   var(--background-strong);
--color-canvas-stronger: var(--background-stronger);
--color-canvas-inverse:  var(--background-inverse);
--color-caption:         var(--text-caption);
--color-on-primary-muted:var(--text-on-primary-muted);
--color-{intent}-subtle-hover: var(--{intent}-subtle-hover);
--color-{intent}-border:       var(--{intent}-border);
--color-{intent}-border-subtle:var(--{intent}-border-subtle);
…
```
Existing `--color-*` names stay (no breakage). The re-points change *values* only,
so existing utilities (`bg-primary`, `text-body`, …) keep working, just on the new
shades.

## 4. Component migration
The re-points re-theme **every** token-CSS component automatically (Button, Alert,
Badge, IconButton) — no per-component edits, just re-verify. Then opportunistically:
- **Badge** outline/ghost border → `--{intent}-border` (now vivid 500) — already
  wired; just picks up the new value.
- Anything wanting the new surfaces/text roles can adopt `bg-canvas-strong`,
  `text-caption`, etc.
No structural component changes required by this plan.

## 5. Phasing (PRs)
- **PR-1 — Re-points (behavior-changing, no new tokens).** Primitive neutral
  slate→neutral; the 15 semantic shade re-points (light+dark). Regenerate tokens;
  visually verify Button/Alert/Badge/IconButton in light+dark (Storybook). This is
  the "make existing components match the Figma" PR. *Breaking-ish:* colors shift
  app-wide (slate→neutral, warning darker, subtle/borders shift).
- **PR-2 — New surface + text roles.** `background.strong/stronger/inverse*`,
  `text.caption/on-primary-*/heading-brand`, `border.disabled` fix; `@theme`
  additions. Purely additive.
- **PR-3 — New intent roles.** `{intent}.subtle-hover` + `{intent}.border-subtle`
  across the 4 intents; `@theme` additions. Purely additive.
- **PR-4 — Adopt where useful + docs.** Wire any component that should use the new
  roles; update Storybook token docs + `docs/figma-token-diff.md` (flip ❌→✅).
- Each PR: `npm run tokens && npm run typecheck && npm run build`, then merge +
  (PR-1) `release:minor` given the app-wide color shift, (PR-2/3/4) `release:patch`.

## 6. Verification per PR
- `npm run tokens` regenerates `theme-{light,dark}.css` + component CSS clean.
- Diff the generated CSS to confirm only intended vars changed.
- Storybook light + dark: spot-check Button/Badge/Alert matrices against the Figma
  screenshots (primary 600, warning 600, subtle 100, borders 500, neutral = true
  neutral).
- Contrast sanity on the re-points (warning-600 + white; neutral-200 surfaces).

## 7. Open decisions
- **PR-1 is an app-wide recolor** (slate→neutral especially). Confirm that's wanted
  vs keeping slate (slate is a deliberate "cool" neutral; the Figma uses plain
  neutral). If slate should stay, drop the primitive re-point and accept the
  neutral-family ⚠️ permanently.
- **`fg`/icon tier:** plan keeps icons on `text-*`/intent (Tailwind-native). Only
  add an `--color-icon-*` set if a real divergence appears (none today).
- **Dark mode authority:** base keeps its inverted dark theme (Figma has none).
  When jspr regenerates the Figma, it should *write* base's dark values into the
  Figma's Dark mode (currently flat) — a follow-up to the pipeline, not this plan.
```
