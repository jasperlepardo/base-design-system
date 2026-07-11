# Base Design System — Agent Context

React + TypeScript component library. Tokens are the source of truth: Tailwind palette → raw → primitives → semantics → components → CSS vars + typed manifests. Storybook documents everything. Code drives Figma (not the other way around).

## Key commands

| Command | What it does |
|---|---|
| `npm run tokens` | Regenerate all token CSS + TS manifests (run after editing any `tokens/**/*.json`) |
| `npm run storybook` | Start Storybook dev server on :6006 |
| `npm run build` | Typecheck + build dist |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests (jsdom) |
| `npx vitest --project storybook` | Run Storybook component tests (Playwright browser mode) |
| `npm run release:patch/minor/major` | Bump version + tag |

`prestorybook` / `prebuild` / `prebuild-storybook` all run `npm run tokens` automatically.

## Project structure

```
tokens/
  primitives.json          # Brand color families + scales (alias raw)
  semantics/               # Purpose tokens: color/bg/fg/text/border (light & dark), spacing, etc.
  components/              # Per-component tokens: button.json, alert.json, badge.json, …
  raw.json                 # Generated from Tailwind theme — DO NOT edit manually
src/
  components/<Name>/
    <Name>.tsx             # Component + exported types + const arrays for variants
    <Name>.stories.tsx     # Storybook stories (Meta + StoryObj)
    <name>.css             # Component structure CSS (imports generated CSS vars)
  styles/
    tokens/                # Generated CSS — DO NOT edit manually
    components/            # Generated component CSS — DO NOT edit manually
  tokens/generated/        # Generated TS manifests — DO NOT edit manually
  docs/                    # Foundations stories (Colors, Typography, Spacing)
.storybook/
  main.ts                  # Addons: docs, a11y, themes, addon-vitest, @chromatic-com/storybook
  preview.ts               # Global parameters: controls matchers, theme decorator, story sort
```

## Component conventions

- Props export: always export the const arrays used for variants (e.g. `buttonIntents`, `buttonSizes`) so stories can import them for `argTypes.options`
- Every component story file needs:
  - `args` with sensible defaults
  - `argTypes` with `inline-radio` controls for union props, `boolean` for flags
  - A `Playground` story (uses `args`, no render override unless layout wrapper needed)
  - A `play` function on Playground (or a dedicated interaction story) for components with user interactions
- `play` functions import from `storybook/test`: `expect`, `fn`, `userEvent`, `within`
- Mock handlers go in meta `args` (`onClick: fn()`), not in individual stories

## Token pipeline rules

- **Never edit** `tokens/raw.json`, `src/styles/tokens/`, `src/styles/components/`, `src/tokens/generated/` — all generated
- To add a new component token tier: add `tokens/components/<name>.json`, add a build step in `scripts/build-components.mjs`, run `npm run tokens`
- Semantic color tokens follow `color/<property>/<role>` naming: `color-bg-default`, `color-text-heading`, `color-border-primary`
- Theme switching: `data-theme="light"|"dark"` on `<html>`; omit for OS auto

## Testing

- **Unit tests**: `src/**/*.test.{ts,tsx}`, run with `npm test` (jsdom)
- **Component tests**: all `.stories.tsx` files, run with `npx vitest --project storybook` (Playwright, Chromium headless)
- vitest.config.ts must have `resolve.conditions: ['browser','import','module','default']` and `optimizeDeps.include: ['react/jsx-dev-runtime','react/jsx-runtime']` — without these, cold-cache runs fail (see memory for details)

## Git / PR flow

- Branch protection on `main` — all changes via PR
- Required CI check: `verify` (lint + typecheck + build)
- CI also runs `test` job (Vitest Storybook component tests via Playwright)
- Commit style: `feat:`, `fix:`, `chore:`, `docs:` prefixes

## What NOT to do

- Don't edit generated files (raw tokens, generated CSS/TS)
- Don't add `@types/node` — tsconfig already handles node types via `"types": []`
- Don't use `resolve.dedupe` or `optimizeDeps.include: ['react','react-dom']` in vitest config — breaks module resolution
