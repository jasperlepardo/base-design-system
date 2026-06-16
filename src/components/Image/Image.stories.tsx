import type { Meta, StoryObj } from '@storybook/react';
import { Image, imageRatios } from './Image';

const SRC = 'https://picsum.photos/640/640';

const meta = {
  title: 'Components/Image',
  component: Image,
  tags: ['autodocs'],
  args: { ratio: '1:1', portrait: false, fit: 'cover', src: SRC, alt: '' },
  argTypes: {
    ratio: { control: 'inline-radio', options: imageRatios },
    fit: { control: 'inline-radio', options: ['cover', 'contain'] },
    portrait: { control: 'boolean' },
  },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 280 }}>
      <Image {...args} />
    </div>
  ),
};

export const Ratios: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-3" style={{ width: 480 }}>
      {(['1:1', '16:9', '4:3'] as const).map((r) => (
        <Image key={r} ratio={r} src={SRC} alt="" />
      ))}
    </div>
  ),
};
