import type { Meta, StoryObj } from '@storybook/react';
import { Link, linkIntents } from './Link';
import { Icon } from '../Icon/Icon';

const ArrowLeft = (
  <Icon size={24}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </Icon>
);
const ExternalLink = (
  <Icon size={24}>
    <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </Icon>
);

const meta = {
  title: 'Components/Link',
  component: Link,
  tags: ['autodocs'],
  args: { children: 'Read the docs', href: '#', intent: 'primary' },
  argTypes: {
    intent: { control: 'inline-radio', options: linkIntents },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Link href="#" leadingIcon={ArrowLeft}>
        Back
      </Link>
      <Link href="#" trailingIcon={ExternalLink} target="_blank">
        Open in new tab
      </Link>
      <Link href="#" disabled>
        Unavailable
      </Link>
    </div>
  ),
};

export const Intents: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-2">
      {linkIntents
        .filter((i) => i !== 'white')
        .map((intent) => (
          <Link key={intent} href="#" intent={intent}>
            {intent}
          </Link>
        ))}
      <div className="mt-2 rounded-md bg-heading p-3">
        <Link href="#" intent="white">
          white (on dark)
        </Link>
      </div>
    </div>
  ),
};
