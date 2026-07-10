import type { Meta, StoryObj } from '@storybook/react';
import { semanticTokens, type DesignToken } from '../tokens';

const meta = {
  title: 'Foundations/Typography',
  parameters: { layout: 'fullscreen', options: { showPanel: false } },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const SIZE_ORDER = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];

// Group the `text` ramp tokens (--text-<size>-<prop>) by size.
function ramp() {
  const bySize: Record<string, Record<string, DesignToken>> = {};
  for (const t of semanticTokens) {
    if (t.path[1] !== 'text') continue;
    const [, , size, prop] = t.path;
    (bySize[size] ??= {})[prop] = t;
  }
  return SIZE_ORDER.filter((s) => bySize[s]).map((s) => ({ size: s, props: bySize[s] }));
}

const familyTokens = semanticTokens.filter((t) => t.path[1] === 'font-family');
const weightTokens = semanticTokens.filter((t) => t.path[1] === 'font-weight');

export const Typography: Story = {
  render: () => (
    <div className="bg-default p-6 text-body">
      <h1 className="mb-1 text-2xl font-semibold text-heading">Typography</h1>
      <p className="mb-8 text-sm text-muted">
        The type ramp is one semantic step (<code>--text-&lt;size&gt;</code>) that bundles font-size,
        line-height, font-family and letter-spacing — exposed as Tailwind&rsquo;s <code>text-*</code>{' '}
        utilities. Each row below renders at its own token.
      </p>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Scale</h2>
        <div className="flex flex-col gap-5">
          {ramp().map(({ size, props }) => (
            <div key={size} className="flex items-baseline gap-4 border-b border-default pb-4">
              <code className="w-16 flex-none text-xs text-muted">{size}</code>
              <span
                className="truncate text-heading"
                style={{
                  fontSize: `var(${props['font-size'].cssVar})`,
                  lineHeight: `var(${props['line-height'].cssVar})`,
                  letterSpacing: `var(${props['letter-spacing'].cssVar})`,
                }}
              >
                The quick brown fox
              </span>
              <code className="ml-auto flex-none text-xs text-muted">
                {props['font-size'].value} / {props['line-height'].value}
              </code>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Families</h2>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {familyTokens.map((t) => (
            <div key={t.cssVar} className="rounded-md border border-default p-3">
              <code className="text-xs text-muted">{t.cssVar}</code>
              <p className="mt-2 text-lg text-heading" style={{ fontFamily: `var(${t.cssVar})` }}>
                Ag — The quick brown fox
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Weights</h2>
        <div className="flex flex-col gap-3">
          {weightTokens.map((t) => (
            <div key={t.cssVar} className="flex items-baseline gap-4">
              <code className="w-56 flex-none text-xs text-muted">{t.cssVar}</code>
              <span className="text-lg text-heading" style={{ fontWeight: t.value as string }}>
                The quick brown fox ({t.value})
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  ),
};
