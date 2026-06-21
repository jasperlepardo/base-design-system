import type { Meta, StoryObj } from '@storybook/react';
import { Page } from './Page';
import { Section } from '../Section/Section';

const meta = {
  title: 'Layout/Page',
  component: Page,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shell: Story = {
  render: () => (
    <Page style={{ minHeight: 320 }}>
      <nav className="bg-secondary px-6 py-3 text-sm font-medium text-heading shadow-sm">
        Sticky Navbar
      </nav>
      <Section>
        <Section.Container>
          <p className="text-body">Body content — the footer pins to the bottom on short pages.</p>
        </Section.Container>
      </Section>
      <footer className="bg-secondary px-6 py-4 text-sm text-muted">Pinned Footer</footer>
    </Page>
  ),
};
