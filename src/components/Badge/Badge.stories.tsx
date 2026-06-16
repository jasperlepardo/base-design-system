import type { Meta, StoryObj } from '@storybook/react';
import { Badge, badgeIntents, badgeStyles } from './Badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { children: 'Badge', intent: 'primary', variant: 'soft', size: 'md' },
  argTypes: {
    intent: { control: 'inline-radio', options: badgeIntents },
    variant: { control: 'inline-radio', options: badgeStyles },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Matrix: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {badgeIntents.map((intent) => (
        <div key={intent} className="flex items-center gap-2">
          {badgeStyles.map((variant) => (
            <Badge key={variant} intent={intent} variant={variant}>
              {intent}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};
