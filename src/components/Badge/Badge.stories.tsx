import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Badge, badgeIntents, badgeStyles, badgeSizes } from './Badge';
import { Icon } from '../Icon/Icon';

const CheckGlyph = (
  <Icon size={20}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { children: 'Badge', intent: 'default', variant: 'solid', size: 'medium' },
  argTypes: {
    intent: { control: 'inline-radio', options: badgeIntents },
    variant: { control: 'inline-radio', options: badgeStyles },
    size: { control: 'inline-radio', options: badgeSizes },
    dot: { control: 'boolean' },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithDot: Story = {
  args: { intent: 'success', dot: true, children: 'Active' },
};

export const WithIcon: Story = {
  args: { intent: 'primary', leadingIcon: CheckGlyph, children: 'Verified' },
};

export const Dismissible: Story = {
  args: { intent: 'danger', children: 'Error', onDismiss: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: /dismiss/i });
    await userEvent.click(btn);
    await expect(args.onDismiss).toHaveBeenCalledOnce();
  },
};

export const Matrix: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {badgeStyles.map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-2">
          {badgeIntents.map((intent) => (
            <Badge key={intent} intent={intent} variant={variant}>
              {intent}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {badgeSizes.map((size) => (
        <Badge key={size} intent="primary" size={size}>
          {size}
        </Badge>
      ))}
    </div>
  ),
};
