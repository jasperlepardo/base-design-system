import type { Meta, StoryObj } from '@storybook/react';
import { Footer } from './Footer';
import { Link } from '../Link/Link';

const meta = {
  title: 'Layout/Footer',
  component: Footer,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Footer>
      <Footer.Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>© 2026 Example, Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="#">Terms</Link>
            <Link href="#">Privacy</Link>
            <span>v1.0.0</span>
          </div>
        </div>
      </Footer.Container>
    </Footer>
  ),
};
