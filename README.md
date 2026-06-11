# Base Design System

A personal React + TypeScript component library and design-token pipeline.
Tokens are authored **in code** with **Tailwind's color palette as the raw
tier**, flow through a four-tier reference graph
(**raw → primitives → semantics**) into runtime-themeable CSS via **Style
Dictionary** + **Tailwind CSS v4**, are documented in **Storybook**, and are
**mirrored into Figma** as variables (code is the source of truth).

```
Tailwind palette ──gen──▶ tokens/raw.json ─┐
tokens/scale.json ─────────────────────────┤
tokens/primitives.json ────────────────────┼─Style Dictionary─▶ src/styles/tokens/*.css  (CSS vars)
tokens/semantics/{shared,light,dark}.json ──┘                 └─▶ src/tokens/generated/*.ts (typed)
tokens/components/button.json ──build-components──▶ src/styles/components/button.css + manifest
                                                  └─sync-figma──▶ figma/variables.json (Figma mirror)
```

## Token architecture

| Tier          | File(s)                            | Role                                                              |
| ------------- | ---------------------------------- | ----------------------------------------------------------------- |
| **Raw**       | `tokens/raw.json` (generated)      | Tailwind's full palette as literal oklch values.                  |
|               | `tokens/scale.json`                | Non-color raw foundations: spacing, radius, type, font families.  |
| **Primitive** | `tokens/primitives.json`           | Named scales (`brand`, `neutral`, `success`, …) that alias Raw.   |
| **Semantic**  | `tokens/semantics/*.json`          | Purpose tokens (`background-default`, `text-heading`, …) that alias Primitives and **resolve per theme**. |
| **Component** | `tokens/components/button.json`    | Per-component values keyed by `intent/style/size`, aliasing semantics. |

`tokens/raw.json` is **generated** from the installed `tailwindcss` package by
`scripts/gen-raw-from-tailwind.mjs` — so "raw" is literally Tailwind's colors.
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
<html data-theme="dark">   <!-- force dark; omit the attribute to follow the OS -->
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
@import "@jasperlepardo/base-design-system/theme";
```

## Components

`Button`, `Text`, `Icon`, `Link`, `Badge`, `Card`, `Alert`, and the field
primitives (`TextField`, `FormField`, `FormLabel`). `Button` is **component-token
driven** — `intent`/`variant`/`size` become `data-*` attributes that select
generated CSS rules. The rest use the semantic Tailwind utilities directly.

## Figma sync (code → Figma)

```bash
npm run figma:sync   # → figma/variables.json
```

Builds a Figma-ready variable manifest (collections **Raw**, **Primitive**, and
**Semantic** with **Light**/**Dark** modes), converting Tailwind's oklch colors
to Figma `{ r, g, b, a }` and turning cross-tier references into variable
aliases. Push the manifest into a Figma file via the Figma plugin / MCP
(`use_figma`). Code remains the source of truth; Figma is the generated mirror.

## Scripts

| Command                  | Does                                                       |
| ------------------------ | ---------------------------------------------------------- |
| `npm run tokens`         | Generate raw → build token CSS/TS → build component tokens |
| `npm run dev`            | Start Storybook on :6006                                   |
| `npm run build`          | Type-check + build the library to `dist/`                  |
| `npm run build-storybook`| Build the static Storybook site                            |
| `npm run figma:sync`     | Emit the Figma variable manifest                           |
| `npm run lint` / `typecheck` / `format` | Quality gates                               |

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
