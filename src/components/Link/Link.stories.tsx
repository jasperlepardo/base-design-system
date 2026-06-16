import type { Meta, StoryObj } from '@storybook/react';
import { Link } from './Link';

const meta = {
  title: 'Components/Link',
  component: Link,
  tags: ['autodocs'],
  args: { children: 'Read the docs', href: '#', tone: 'primary' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['primary', 'default'] },
    underline: { control: 'inline-radio', options: ['hover', 'always'] },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
