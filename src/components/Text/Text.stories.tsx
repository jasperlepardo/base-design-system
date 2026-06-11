import type { Meta, StoryObj } from '@storybook/react';
import { Text, textVariants } from './Text';

const meta = {
  title: 'Components/Text',
  component: Text,
  tags: ['autodocs'],
  args: { children: 'The quick brown fox', variant: 'body' },
  argTypes: { variant: { control: 'select', options: textVariants } },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Scale: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {textVariants.map((variant) => (
        <Text key={variant} variant={variant}>
          {variant} — The quick brown fox jumps over the lazy dog
        </Text>
      ))}
    </div>
  ),
};
