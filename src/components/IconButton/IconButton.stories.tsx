import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { IconButton, iconButtonIntents, iconButtonStyles, iconButtonSizes } from './IconButton';
import { Icon } from '../Icon/Icon';

const CloseGlyph = (
  <Icon>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: {
    label: 'Close',
    intent: 'primary',
    variant: 'solid',
    size: 'default',
    children: CloseGlyph,
    onClick: fn(),
  },
  argTypes: {
    intent: { control: 'inline-radio', options: iconButtonIntents },
    variant: { control: 'inline-radio', options: iconButtonStyles },
    size: { control: 'inline-radio', options: iconButtonSizes },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: /close/i });
    await expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Matrix: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {iconButtonIntents.map((intent) => (
        <div key={intent} className="flex items-center gap-2">
          {iconButtonStyles.map((variant) => (
            <IconButton
              key={variant}
              intent={intent}
              variant={variant}
              label={`${intent} ${variant}`}
            >
              {CloseGlyph}
            </IconButton>
          ))}
        </div>
      ))}
    </div>
  ),
};
