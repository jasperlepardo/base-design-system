import type { Meta, StoryObj } from '@storybook/react';
import { ButtonGroup, buttonGroupOrientations, buttonGroupAligns } from './ButtonGroup';
import { Button } from '../Button/Button';

const meta = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
  args: { orientation: 'horizontal', align: 'end', fill: false },
  argTypes: {
    orientation: { control: 'inline-radio', options: buttonGroupOrientations },
    align: { control: 'inline-radio', options: buttonGroupAligns },
    fill: { control: 'boolean' },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <ButtonGroup {...args} className="w-96">
      <Button intent="default" variant="ghost">
        Cancel
      </Button>
      <Button intent="primary">Confirm</Button>
    </ButtonGroup>
  ),
};
