# Figma ↔ base semantic-token diff

> **Status — alignment landed (v0.8.0 → v0.9.2).** The audit below was the
> starting point; the gaps it identified are now closed in code:
> - **slate → true neutral** (one primitive re-point) — v0.8.0
> - **shade re-points**: warning solid 500→600, `{intent}-subtle` 50→100,
>   `{intent}-border` 100→**500**, `text-body`→800, `text-muted`→700,
>   `*-disabled`→400 (light + dark) — v0.8.0
> - **surfaces**: `background.strong` (bg/tertiary 200), `stronger`
>   (quarternary 400), `inverse` (default-solid 900) — v0.9.0
> - **intents**: `{intent}.subtle-hover` (200), `{intent}.border-subtle` (300),
>   `primary.border` (500) — v0.9.2
> - **spacing**: Tailwind `0.5` (2px) step + `--space-3xs`; settable
>   `spacing.multiplier`; rem→px for Figma — v0.9.0–v0.9.2
>
> Still intentionally **not** ported (Tailwind-native decision): the per-property
> `fg/*` tier and the `bg`/`text` duplicates — in code one `--color-*` role drives
> every property utility, so Figma's per-binding duplication collapses to roles.
> A few deep neutral "solid" darks (`bg/secondary-solid` etc.) and `text`
> `caption`/`placeholder`/`*_on-primary` remain unported until a component needs them.

Compares the **JSPR-Tokens** Figma library (`4A0TgVbwojrRl48lG0GeBu`, `03 Semantics`
collection — 224 vars, 105 of them color) against base's semantic layer
(`src/styles/tokens/theme-{light,dark}.css`, ~46 color semantics).

Legend:
- ✅ **match** — base has this role at the same family + shade.
- ⚠️ **re-point** — base has the role but a different *shade* (just re-alias an existing token; no new color).
- ❌ **missing** — base has no semantic for this role.

**Two global notes that color the whole table:**
1. **Palette:** base `--p-color-neutral-*` aliases to **slate** (chroma ≈ 0.013); the Figma uses **true neutral** (chroma 0). So every "neutral" ✅ below is shade-correct but palette-off until `--p-color-neutral-*` is re-pointed `slate → neutral` (both ramps already exist in base raw). One re-point fixes all of them.
2. **Dark mode:** in this Figma file the `Light` and `Dark` modes hold *identical* values — dark mode isn't differentiated yet. base *does* flip values in `theme-dark.css`, so base is ahead here; adopting the Figma's values must not flatten base's dark theme.

---

## Backgrounds — `Color/bg/*`

| Figma token | resolves to | base token | base shade | status |
|---|---|---|---|---|
| `bg/default` | neutral-0 `#ffffff` | `--background-default` | neutral-0 | ✅¹ |
| `bg/secondary` | neutral-50 `#fafafa` | `--background-subtle` | neutral-50 | ✅¹ |
| `bg/neutral-subtle` | neutral-100 `#f5f5f5` | `--background-muted` | neutral-100 | ✅¹ |
| `bg/tertiary` / `bg/neutral` | **neutral-200** `#e5e5e5` | — | — | ❌ |
| `bg/quarternary` | neutral-400 `#a1a1a1` | — | — | ❌ |
| `bg/neutral_hover` | neutral-300 `#d4d4d4` | — | — | ❌ |
| `bg/neutral-subtle_hover` | neutral-200 `#e5e5e5` | — | — | ❌ |
| `bg/default-solid` | neutral-900 `#171717` | — | — | ❌ |
| `bg/secondary-solid` | neutral-800 `#262626` | — | — | ❌ |
| `bg/tertiary-solid` | neutral-700 `#404040` | — | — | ❌ |
| `bg/quarternary-solid` | neutral-600 `#525252` | — | — | ❌ |
| `bg/disabled` | neutral-400 `#a1a1a1` | `--background-disabled` | neutral-100 | ⚠️ |
| `bg/transparent` | `#ffffff00` | transparent | — | ✅ |
| `bg/primary` | blue-600 `#155dfc` | `--primary-default` | blue-600 | ✅ |
| `bg/primary_hover` | blue-700 `#1447e6` | `--primary-hover` | blue-700 | ✅ |
| `bg/primary-subtle` | blue-100 `#dbeafe` | `--primary-subtle` | blue-50 | ⚠️ |
| `bg/primary-subtle_hover` | blue-200 `#bedbff` | — | — | ❌ |
| `bg/success` | green-600 `#00a63e` | `--success-default` | green-600 | ✅ |
| `bg/success_hover` | green-700 `#008236` | `--success-hover` | green-700 | ✅ |
| `bg/success-subtle` | green-100 `#dcfce7` | `--success-subtle` | green-50 | ⚠️ |
| `bg/success-subtle_hover` | green-200 `#b9f8cf` | — | — | ❌ |
| `bg/warning` | amber-600 `#e17100` | `--warning-default` | amber-500 | ⚠️ |
| `bg/warning_hover` | amber-700 `#bb4d00` | `--warning-hover` | amber-600 | ⚠️ |
| `bg/warning-subtle` | amber-100 `#fef3c6` | `--warning-subtle` | amber-50 | ⚠️ |
| `bg/warning-subtle_hover` | amber-200 `#fee685` | — | — | ❌ |
| `bg/danger` | red-600 `#e7000b` | `--danger-default` | red-600 | ✅ |
| `bg/danger_hover` | red-700 `#c10007` | `--danger-hover` | red-700 | ✅ |
| `bg/danger-subtle` | red-100 `#ffe2e2` | `--danger-subtle` | red-50 | ⚠️ |
| `bg/danger-subtle_hover` | red-200 `#ffc9c9` | — | — | ❌ |
| `bg/white` | white `#ffffff` | (`--p-color-neutral-0`) | — | ✅² |
| `bg/white_hover` | `#ffffffcc` | — | — | ❌ |
| `bg/white_subtle` | `#ffffff52` | — | — | ❌ |
| `bg/black` | black `#000000` | (`--p-color-neutral-1000`) | — | ✅² |
| `bg/black_hover` | `#000000cc` | — | — | ❌ |
| `bg/black_subtle` | `#00000052` | — | — | ❌ |

¹ shade-correct, palette-off (slate vs neutral). ² value exists only as a raw primitive, no `bg/*` semantic.

## Borders — `Color/border/*`

| Figma token | resolves to | base token | base shade | status |
|---|---|---|---|---|
| `border/default` | neutral-200 `#e5e5e5` | `--border-default` | neutral-200 | ✅¹ |
| `border/disabled` | neutral-400 `#a1a1a1` | `--border-disabled` | neutral-200 | ⚠️ |
| `border/transparent` | `#ffffff00` | transparent | — | ✅ |
| `border/primary` | blue-**500** `#2b7fff` | `--primary-border` | blue-100 | ⚠️³ |
| `border/primary_subtle` | blue-300 `#8ec5ff` | — | — | ❌ |
| `border/success` | green-**500** `#00c950` | `--success-border` | green-100 | ⚠️ |
| `border/success_subtle` | green-300 `#7bf1a8` | — | — | ❌ |
| `border/warning` | amber-**500** `#fe9a00` | `--warning-border` | amber-100 | ⚠️ |
| `border/warning_subtle` | amber-300 `#ffd230` | — | — | ❌ |
| `border/danger` | red-**500** `#fb2c36` | `--danger-border` | red-100 | ⚠️ |
| `border/danger_subtle` | red-300 `#ffa2a2` | — | — | ❌ |
| `border/white` | white | (`--p-color-neutral-0`) | — | ✅² |
| `border/black` | black | (`--p-color-neutral-1000`) | — | ✅² |

³ blue-500 also exists as `--border-focus`; base's `*-border` tokens are a *soft* 100, the Figma's are a *vivid* 500.

## Text — `Color/text/*`

| Figma token | resolves to | base token | base shade | status |
|---|---|---|---|---|
| `text/heading` | neutral-900 `#171717` | `--text-heading` | neutral-900 | ✅¹ |
| `text/body` | neutral-800 `#262626` | `--text-body` | neutral-700 | ⚠️ |
| `text/muted` | neutral-700 `#404040` | `--text-muted` | neutral-500 | ⚠️ |
| `text/caption` | neutral-600 `#525252` | — | — | ❌ |
| `text/placeholder` | neutral-600 `#525252` | — | — | ❌ |
| `text/disabled` | neutral-400 `#a1a1a1` | `--text-disabled` | neutral-400 | ✅¹ |
| `text/heading_brand` | blue-800 `#193cb8` | — | — | ❌⁴ |
| `text/heading_on-primary` | white | `--text-inverse` | neutral-0 | ✅² |
| `text/body_on-primary` | `#ffffffcc` | — | — | ❌ |
| `text/muted_on-primary` | `#ffffffa3` | — | — | ❌ |
| `text/primary` | blue-600 `#155dfc` | `--text-link` | blue-600 | ✅² |
| `text/primary_hover` | blue-700 `#1447e6` | — | — | ❌ |
| `text/success` | green-600 `#00a63e` | — | — | ❌⁵ |
| `text/success_hover` | green-700 `#008236` | — | — | ❌ |
| `text/warning` | amber-600 `#e17100` | — | — | ❌⁵ |
| `text/warning_hover` | amber-700 `#bb4d00` | — | — | ❌ |
| `text/danger` | red-600 `#e7000b` | — | — | ❌⁵ |
| `text/danger_hover` | red-700 `#c10007` | — | — | ❌ |
| `text/white` | white | (`--p-color-neutral-0`) | — | ✅² |
| `text/white_hover` | white | — | — | ❌ |
| `text/white_disabled` | `#ffffff52` | — | — | ❌ |
| `text/black` | black | — | — | ❌ |
| `text/black_hover` | black | — | — | ❌ |
| `text/black_disabled` | `#00000052` | — | — | ❌ |

⁴ blue-800 exists as `--primary-active` (different role). ⁵ value exists as `--{intent}-default`, but there's no `text/{intent}` semantic — components reuse the intent default for text.

## Foreground / icon — `Color/fg/*` (32 tokens)

base has **no dedicated `fg`/icon semantic tier** — icons inherit `currentColor` and components map their icon var to a text/intent token (e.g. Badge's `--badge-icon`). The Figma's 32 `fg/*` tokens mirror the `bg/*` values exactly (`fg/primary` = blue-600, `fg/warning` = amber-600, `fg/default-solid` = neutral-900, etc.).

**Status: ❌ entire tier missing** as named semantics (values are reachable via the bg/intent equivalents).

---

## Roll-up

| Family | Figma tokens | ✅ match | ⚠️ re-point | ❌ missing |
|---|---|---:|---:|---:|
| `bg/*` | 36 | 11 | 8 | 17 |
| `border/*` | 13 | 4 | 5 | 4 |
| `text/*` | 24 | 5 | 2 | 17 |
| `fg/*` | 32 | 0 | 0 | 32 |
| **Total** | **105** | **20** | **15** | **70** |

### The ⚠️ re-points (existing tokens, just change the alias — no new colors)
- `--p-color-neutral-*`: **slate → true neutral** (fixes every neutral row at once)
- `--warning-default`: amber-500 → **amber-600** (and shift `--warning-hover` 600 → 700)
- `--{primary,success,warning,danger}-subtle`: **-50 → -100**
- `--{primary,success,warning,danger}-border`: **-100 → -500** (vivid, matching the Figma's outline borders)
- `--background-disabled` / `--border-disabled`: neutral-100/200 → **neutral-400**
- `--text-body`: neutral-700 → **neutral-800**; `--text-muted`: neutral-500 → **neutral-700**

⚠️ Re-points touch shared tokens, so they re-theme **Button / Alert / Badge / everything** — they need a light+dark regression pass.

### The ❌ gaps (would be new semantics if base adopts this structure)
- **Neutral bg ramp:** `bg/tertiary` (200), `bg/quarternary` (400), `bg/neutral_hover` (300) + the four `*-solid` darks (900/800/700/600).
- **Intent `*-subtle_hover`** bg variants (blue/green/amber/red-200) — needed for hover states.
- **Vivid + subtle intent borders:** the `border/{intent}_subtle` (-300) set (the -500 vivid is a re-point above).
- **Text:** `caption` / `placeholder` (neutral-600), `*_on-primary` (white α variants), `text/{intent}` + `_hover`, `heading_brand`.
- **Black family** bg/border/text + `white`/`black` `_subtle` / `_hover` alphas.
- **The whole `fg`/icon tier** (or a decision to keep folding icon color into text/intent).

## Bottom line
base **covers the core** (default bg, the intent default/hover/subtle trio, heading/body/muted/disabled text, default border) — **20/105 exact, 15 one-shade re-points** — but is **missing ~70** of this Figma's semantics, concentrated in: the deep neutral bg ramp + dark "solid" ramp, hover-subtle variants, vivid/subtle intent borders, the richer text roles, and the entire fg/icon tier. Adopting this token structure wholesale is a real expansion of base's semantic layer (≈ doubling it), not a tweak.
