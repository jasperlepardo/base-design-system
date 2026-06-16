import type { Meta, StoryObj } from '@storybook/react';
import { BadgeCounter } from './BadgeCounter';
import { badgeIntents, badgeStyles } from './Badge';

const meta = {
  title: 'Components/BadgeCounter',
  component: BadgeCounter,
  tags: ['autodocs'],
  args: { intent: 'danger', variant: 'solid', count: 5 },
  argTypes: {
    intent: { control: 'inline-radio', options: badgeIntents },
    variant: { control: 'inline-radio', options: badgeStyles },
  },
} satisfies Meta<typeof BadgeCounter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Overflow: Story = {
  args: { count: 128, max: 99 },
};

export const Matrix: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {badgeStyles.map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-2">
          {badgeIntents.map((intent) => (
            <BadgeCounter key={intent} intent={intent} variant={variant} count={9} />
          ))}
        </div>
      ))}
    </div>
  ),
};
