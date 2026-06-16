import type { Meta, StoryObj } from '@storybook/react';
import { semanticTokens, type DesignToken } from '../tokens';

const meta = {
  title: 'Foundations/Colors',
  parameters: { layout: 'fullscreen', options: { showPanel: false } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const colorTokens = semanticTokens.filter((t) => t.type === 'color');

// Group by the first path segment (background, text, primary, …).
function groupByCategory(tokens: DesignToken[]) {
  const groups: Record<string, DesignToken[]> = {};
  for (const t of tokens) {
    const key = t.path[1] ?? 'other'; // path[0] === 'semantic'
    (groups[key] ??= []).push(t);
  }
  return groups;
}

function Swatch({ token }: { token: DesignToken }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-line p-2">
      <span
        className="h-9 w-9 flex-none rounded-md border border-line-subtle"
        style={{ backgroundColor: `var(${token.cssVar})` }}
      />
      <span className="flex flex-col">
        <code className="text-xs text-heading">{token.cssVar}</code>
        <code className="text-xs text-muted">{token.ref ?? token.value}</code>
      </span>
    </div>
  );
}

export const Semantic: Story = {
  render: () => {
    const groups = groupByCategory(colorTokens);
    return (
      <div className="bg-canvas p-6">
        <h1 className="mb-1 text-2xl font-semibold text-heading">Semantic color tokens</h1>
        <p className="mb-6 text-sm text-muted">
          Each swatch resolves through the cascade: semantic → primitive → raw (Tailwind). Toggle
          the theme in the toolbar to see them re-point.
        </p>
        {Object.entries(groups).map(([category, tokens]) => (
          <section key={category} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              {category}
            </h2>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {tokens.map((t) => (
                <Swatch key={t.cssVar} token={t} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  },
};
