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

`light` (default, also seeds `:root`) and `dark`, selected via the
`data-theme` attribute. Colors differ per theme; spacing, radius, and type are
shared (`tokens/semantics/shared.json`).

```html
<html data-theme="dark">
```

## Install & use

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

- **Storybook** auto-deploys to **GitHub Pages** on push to `main`
  (`.github/workflows/storybook.yml`). Enable Pages → "GitHub Actions" once.
- **npm** publishes on a published GitHub Release
  (`.github/workflows/publish.yml`); add an `NPM_TOKEN` secret.

## License

MIT
