# Base Design System

A personal React + TypeScript component library and design-token pipeline.
Tokens are authored **in code** with **Tailwind's color palette as the raw
tier**, flow through a four-tier reference graph
(**raw → primitives → semantics → components**) into runtime-themeable CSS via **Style
Dictionary** + **Tailwind CSS v4**, are documented in **Storybook**, and are
**mirrored into Figma** as variables (code is the source of truth).

```
Tailwind theme ──gen──▶ tokens/raw.json ────┐  (colors + spacing/radius/type/shadows)
tokens/primitives.json ─────────────────────┼─Style Dictionary─▶ src/styles/tokens/*.css  (CSS vars)
tokens/semantics/{shared,light,dark}.json ──┘                 └─▶ src/tokens/generated/*.ts (typed)
tokens/components/button.json ──build-components──▶ src/styles/components/button.css + manifest
                                                  └─sync-figma──▶ figma/variables.json (Figma mirror)
```

## Token architecture

| Tier          | File(s)                         | Role                                                                                                      |
| ------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Raw**       | `tokens/raw.json` (generated)   | All of Tailwind's theme: palette (oklch) plus spacing, radius, type, and shadows.                         |
| **Primitive** | `tokens/primitives.json`        | Brand color families (`neutral`, `primary`, `success`, `warning`, `danger`, `white`, `black`) plus curated scales (spacing, radius, border-width, container, type, shadow, blur, …), all aliasing Raw. |
| **Semantic**  | `tokens/semantics/*.json`       | Purpose tokens (`background-default`, `text-heading`, …) that alias Primitives and **resolve per theme**. |
| **Component** | `tokens/components/button.json` | Per-component values keyed by `intent/style/size`, aliasing semantics.                                    |

`tokens/raw.json` is **generated** from the installed `tailwindcss` package by
`scripts/gen-raw-from-tailwind.mjs` — so "raw" is literally Tailwind's own theme.
It is git-ignored and rebuilt by `npm run tokens`.

### CSS variable naming

| Tier      | Prefix       | Example                              |
| --------- | ------------ | ------------------------------------ |
| Raw       | `--raw-*`    | `--raw-color-blue-500`               |
| Primitive | `--p-*`      | `--p-color-brand-600`                |
| Semantic  | _unprefixed_ | `--background-default`, `--space-md` |

Semantic vars are emitted with `outputReferences`, so they resolve as
`var(--p-…) → var(--raw-…)`. The raw/primitive vars live in `:root`
(`base.css`); switching `data-theme="dark"` re-points the cascade with **no
rebuild**.

## Themes

`light` and `dark`, selected via the `data-theme` attribute on `<html>`. Colors
differ per theme; spacing, radius, and type are shared
(`tokens/semantics/shared.json`).

- `data-theme="light"` / `"dark"` — explicit, always wins.
- **No attribute → follows the OS** via `@media (prefers-color-scheme: dark)`
  (the `:root:not([data-theme])` rule in `theme-auto-dark.css`).

```html
<html data-theme="dark">
  <!-- force dark; omit the attribute to follow the OS -->
</html>
```

### Toggling at runtime

The package exports a tiny, framework-light theme controller. `system` mode
just removes the attribute (so the OS media query takes over); `light`/`dark`
set it. The choice persists to `localStorage`.

```tsx
import { useTheme, setThemeMode } from '@jasperlepardo/base-design-system';

// imperatively
setThemeMode('dark'); // 'light' | 'dark' | 'system'

// or in React — [mode, setMode, resolved]
const [mode, setMode, resolved] = useTheme();
```

To avoid a flash of the wrong theme on load, inline `themeScript` in `<head>`
**before** the stylesheet:

```tsx
import { themeScript } from '@jasperlepardo/base-design-system';
// <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
```

## Install & use

Published to **GitHub Packages**. Consumers add a scoped registry line to their
`.npmrc` (the scope is hosted on GitHub, so installs need a GitHub token with
`read:packages`):

```ini
# .npmrc
@jasperlepardo:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

```bash
npm install @jasperlepardo/base-design-system
```

```tsx
import { Button, Card, Badge } from '@jasperlepardo/base-design-system';
// The package injects its CSS automatically on import.

export function Example() {
  return (
    <Card variant="raised">
      <Card.Header>
        <Card.Title>Hello</Card.Title>
      </Card.Header>
      <Card.Body>
        <Badge intent="success">Shipped</Badge>
      </Card.Body>
      <Card.Footer>
        <Button>Continue</Button>
      </Card.Footer>
    </Card>
  );
}
```

Tailwind users can also import just the theme to get the semantic utility scale
(`bg-canvas`, `text-heading`, `border-line`, `bg-brand`, …):

```css
@import '@jasperlepardo/base-design-system/theme';
```

## Components

Import any component from the package root — the CSS is injected on import. Every
component re-themes across light/dark and is documented in **Storybook**
(`npm run dev`).

**Actions**

- `Button` — `intent`/`variant`/`size` → `data-*` attributes selecting generated CSS.
- `IconButton` — the square, icon-only counterpart of Button (same color matrix).
- `ButtonGroup` — row/stacked action cluster with optional equal-width `fill`.
- `Link` — themed anchor.

**Forms & fields** — all spread native props and wire through `FormField`
(`id` / `aria-describedby` / `aria-invalid`):

- `FormField` / `FormLabel` — label + hint/error + a11y wiring (render prop).
- `TextField`, `Textarea`, `Select` (native), `Checkbox`, `Radio`.
- `OTP` — one-time-passcode input (auto-advance, paste-to-fill).
- `Combobox` — searchable single-select.
- `MultiSelect` — multi-value with removable chips.
- `Autocomplete` — free-text with suggestions.
- `DatePicker` — keyboard-navigable calendar popover.

**Layout**

- `Page` — full-height shell (sticky child `<nav>`, pinned child `<footer>`).
- `Section` / `Section.Container` / `Row` / `Column` — full-bleed regions over a 12-col grid.
- `Form` (+ `Form.Section` / `Form.Header` / `Form.Group` / `Form.Fieldset`) — vertical form layout.
- `Footer` (+ `Footer.Container`).

**Display**

- `Text`, `Icon`, `Badge`, `Card`, `Image`.
- `Alert` — status banner: `intent` (default/primary/success/warning/danger) ×
  `variant` (solid/outline/transparent) × `horizontal`, with `actions`, `onClose`
  dismiss, and a per-intent status icon. Compound API: `Alert.Root` / `Alert.Icon`
  / `Alert.Content` / `Alert.Text` / `Alert.Title` / `Alert.Body` / `Alert.Actions`
  (+ `Alert.Action`) / `Alert.Close`, plus the `<Alert>` convenience wrapper.
- `List` (+ `List.Section` / `List.Header` / `List.Group` / `List.Item` and the
  `List.Leading` / `List.Content` / `List.Title` / `List.Value` / `List.Trailing` slots).

**Overlay foundation**

- `Dropdown` / `DropdownItem` plus the `useDropdown` (open/close, outside-click,
  Escape) and `useListbox` (WAI-ARIA keyboard model) hooks — the popover/listbox
  primitives the combobox family (Combobox, MultiSelect, Autocomplete) is built on.

`Button`, `IconButton`, and `Alert` are **component-token driven** (generated
`.jspr-*` CSS from `tokens/components/*.json`); the rest use semantic Tailwind
utilities (with a little committed CSS for layout pieces like
Page/ButtonGroup/List/Dropdown/Alert).

## Customizing as a consumer (`jspr`)

Downstream projects don't fork — they **extend**. Add a `jspr.config.js` and run the
bundled `jspr` CLI to regenerate your own token CSS / `@theme`, TS manifests, and a
full Figma library (variables + components). Your repo stays the source of truth.

```js
// jspr.config.js
export default {
  // Where generated files land in your repo.
  out: { css: 'src/design/css', ts: 'src/design/generated', figma: '.figma' },

  // Remap color roles to any Tailwind family — the whole 50–950 ramp follows.
  roles: {
    danger: 'pink', // shorthand: the danger ramp now follows pink
    brand: { base: 'violet', 600: '{indigo.600}' }, // ramp + per-shade override
  },

  // Optionally retarget which primitive shade a semantic uses, per theme.
  semantics: { dark: { danger: { default: 400 } } },

  // Rescale the whole spacing system with one knob. The raw scale is numeric
  // (Tailwind steps) and each value = step × multiplier; semantic t-shirt sizes
  // (--space-2xs…3xl) alias the raw steps, so they rescale too. Accepts px or
  // rem; default follows Tailwind's --spacing (0.25rem). `remRoot` (default 16)
  // is the rem↔px root used to materialise px for Figma variables.
  spacing: { multiplier: '5px', remRoot: 16 },

  // Override scale/raw, or point at your own component token files.
  radius: { md: 'lg' },
  components: { dir: 'tokens/components' },
};
```

> **Spacing in code vs Figma:** code keeps spacing in **rem** (scales with root
> font-size); the Figma variables are materialised in **px** (Figma has no rem),
> converted at `× remRoot`. So `multiplier: '5px'` → `--raw-spacing-1: 0.3125rem`
> in CSS and `spacing/1 = 5` in Figma.

```bash
npx jspr gen            # tokens + Figma (default: all)
npx jspr gen tokens     # just the @theme CSS + TS manifests
npx jspr gen figma      # variables.json + push scripts + component scripts
```

Overrides are layered (most specific wins): `roles` → `semantics` → `scale` / `raw`
→ component files, deep-merged over the base tokens into **one resolved tree** that
drives both the CSS and Figma. With no `jspr.config`, the CLI reproduces this repo's
own output unchanged.

## Figma (code ↔ design)

**Code → Figma.** `npx jspr gen figma` (or `npm run figma:sync` for variables only)
emits a Figma-ready manifest and runnable scripts under your Figma out dir:

- `variables.json` + `push/*.js` — collections **Raw**, **Primitive**, **Semantic**
  (Light/Dark modes), Tailwind oklch → `{ r, g, b, a }`, cross-tier refs as variable
  aliases. Push via the Figma plugin / MCP (`use_figma`), or headlessly with
  `jspr gen figma --push variables` (REST — **Figma Enterprise only**).
- `components/<name>/*.js` — `use_figma` scripts that build component sets with
  variants bound to the semantic variables (large matrices auto-split to ≤30 per
  set). Run these **after** the variables exist.

**Figma → code.** `jspr pull figma` reverse-maps a designer's variable edits back
into `jspr.config.js` (`--write` to apply, then re-run `jspr gen`). It reads via the
`use_figma` plugin (any plan) or REST (Enterprise). Code stays the source of truth —
a pull is a _proposed_ config edit you review via git diff.

## Scripts

| Command                                 | Does                                                       |
| --------------------------------------- | ---------------------------------------------------------- |
| `npm run tokens`                        | Generate raw → build token CSS/TS → build component tokens |
| `npm run dev`                           | Start Storybook on :6006                                   |
| `npm run build`                         | Type-check + build the library to `dist/`                  |
| `npm run build-storybook`               | Build the static Storybook site                            |
| `npm run figma:sync`                    | Emit the Figma variable manifest                           |
| `npm run figma:push`                    | Push variables via REST (Figma Enterprise)                 |
| `npx jspr gen` / `pull figma`           | Consumer generate / Figma→config pull (see above)          |
| `npm run lint` / `typecheck` / `format` | Quality gates                                              |

## Publishing

`main` is protected (PRs + passing CI required), so releases go through a PR.

1. **Cut a release** (from a clean `main`):

   ```bash
   npm run release:patch   # or release:minor / release:major
   ```

   This bumps the version on a `release/vX.Y.Z` branch and opens a PR
   (`scripts/release.mjs`).

2. **Merge the PR** once CI passes. The **Release** workflow
   (`.github/workflows/release.yml`) then publishes `@jasperlepardo/base-design-system`
   to **GitHub Packages**, tags `vX.Y.Z`, and creates the GitHub Release — all with
   the built-in `GITHUB_TOKEN` (no extra secret).

- **Storybook** auto-deploys to **GitHub Pages** on every push to `main`
  (`.github/workflows/storybook.yml`).
- **Publish (manual)** (`.github/workflows/publish.yml`) is a `workflow_dispatch`
  escape hatch to re-publish the current version.

## License

MIT
