import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button, buttonIntents, buttonStyles, buttonSizes } from './Button';
import { Icon } from '../Icon/Icon';

const ArrowRight = (
  <Icon size={20}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Button', intent: 'primary', variant: 'solid', size: 'default', onClick: fn() },
  argTypes: {
    intent: { control: 'inline-radio', options: buttonIntents },
    variant: { control: 'inline-radio', options: buttonStyles },
    size: { control: 'inline-radio', options: buttonSizes },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: /button/i });
    await expect(button).toBeInTheDocument();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const WithIcon: Story = {
  args: { children: 'Continue', trailingIcon: ArrowRight },
};

export const Matrix: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {buttonIntents.map((intent) => (
        <div key={intent} className="flex flex-wrap items-center gap-3">
          {buttonStyles.map((variant) => (
            <Button key={variant} intent={intent} variant={variant}>
              {intent}/{variant}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {buttonSizes.map((size) => (
        <Button key={size} size={size}>
          Size {size}
        </Button>
      ))}
    </div>
  ),
};
