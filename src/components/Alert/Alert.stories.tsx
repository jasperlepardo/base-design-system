import type { Meta, StoryObj } from '@storybook/react';
import { Alert, alertIntents } from './Alert';
import { Icon } from '../Icon/Icon';

const InfoIcon = (
  <Icon size={20}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Icon>
);

const meta = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  args: {
    intent: 'info',
    title: 'Heads up',
    children: 'This is an informational message driven by semantic tokens.',
    icon: InfoIcon,
  },
  argTypes: { intent: { control: 'inline-radio', options: alertIntents } },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllIntents: Story = {
  render: () => (
    <div className="flex flex-col gap-3" style={{ maxWidth: 480 }}>
      {alertIntents.map((intent) => (
        <Alert key={intent} intent={intent} icon={InfoIcon} title={`${intent} alert`}>
          A short description of what happened.
        </Alert>
      ))}
    </div>
  ),
};
