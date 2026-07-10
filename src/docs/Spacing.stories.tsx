import type { Meta, StoryObj } from '@storybook/react';
import { semanticTokens, type DesignToken } from '../tokens';

const meta = {
  title: 'Foundations/Spacing',
  parameters: { layout: 'fullscreen', options: { showPanel: false } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// Parse a CSS dimension to px for sorting/scaling the bars.
function toPx(v: string): number {
  const m = v.match(/^(-?[\d.]+)(px|rem)?$/);
  if (!m) return NaN;
  return parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1);
}

const group = (name: string) =>
  semanticTokens
    .filter((t) => t.path[1] === name)
    .slice()
    .sort((a, b) => toPx(a.value) - toPx(b.value));

const spacing = group('spacing');
const rounded = group('rounded');
const borderWidth = group('border-width');

function Row({ token }: { token: DesignToken }) {
  return (
    <div className="flex items-center gap-4 border-b border-default py-1.5">
      <code className="w-40 flex-none text-xs text-heading">{token.cssVar}</code>
      <div className="h-4 rounded-sm bg-primary" style={{ width: `min(var(${token.cssVar}), 100%)` }} />
      <code className="ml-auto flex-none text-xs text-muted">{token.value}</code>
    </div>
  );
}

export const Spacing: Story = {
  render: () => (
    <div className="bg-default p-6 text-body">
      <h1 className="mb-1 text-2xl font-semibold text-heading">Spacing &amp; dimension scales</h1>
      <p className="mb-8 text-sm text-muted">
        One base unit (<code>--spacing-1</code> = 0.25rem) drives every <code>p-</code>/<code>m-</code>/
        <code>gap-</code>/<code>w-</code>/<code>h-</code> utility. Radius and border-width are their own
        scales. Bars are drawn at the real token value (capped to the container width).
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Spacing</h2>
        {spacing.map((t) => (
          <Row key={t.cssVar} token={t} />
        ))}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Radius</h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {rounded.map((t) => (
            <div key={t.cssVar} className="flex items-center gap-3">
              <span
                className="h-12 w-12 flex-none border border-default bg-secondary"
                style={{ borderRadius: `var(${t.cssVar})` }}
              />
              <span className="flex flex-col">
                <code className="text-xs text-heading">{t.cssVar}</code>
                <code className="text-xs text-muted">{t.value}</code>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Border width</h2>
        <div className="flex flex-col gap-3">
          {borderWidth.map((t) => (
            <div key={t.cssVar} className="flex items-center gap-4">
              <code className="w-44 flex-none text-xs text-heading">{t.cssVar}</code>
              <span
                className="h-8 w-40 rounded-md border-default bg-default"
                style={{ borderStyle: 'solid', borderWidth: `var(${t.cssVar})` }}
              />
              <code className="ml-auto flex-none text-xs text-muted">{t.value}</code>
            </div>
          ))}
        </div>
      </section>
    </div>
  ),
};
