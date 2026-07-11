import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Alert, alertIntents, alertStyles } from './Alert';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  args: {
    intent: 'primary',
    variant: 'outline',
    horizontal: false,
    title: 'Heads up',
    children: 'This is an informational message driven by semantic tokens.',
  },
  argTypes: {
    intent: { control: 'inline-radio', options: alertIntents },
    variant: { control: 'inline-radio', options: alertStyles },
    horizontal: { control: 'boolean' },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Heads up')).toBeInTheDocument();
    await expect(canvas.getByText('This is an informational message driven by semantic tokens.')).toBeInTheDocument();
  },
};

export const WithActionsAndDismissInteraction: Story = {
  args: {
    intent: 'warning',
    variant: 'outline',
    title: 'Unsaved changes',
    children: 'You have unsaved changes.',
    onClose: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const closeBtn = canvas.getByRole('button', { name: /dismiss/i });
    await userEvent.click(closeBtn);
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};

export const Matrix: Story = {
  render: () => (
    <div className="flex flex-col gap-6" style={{ maxWidth: 1100 }}>
      {alertStyles.map((variant) => (
        <div key={variant} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {alertIntents.map((intent) => (
            <Alert key={intent} intent={intent} variant={variant} title={`${intent} / ${variant}`}>
              A short description of what happened.
            </Alert>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const WithActionsAndDismiss: Story = {
  render: () => (
    <div className="flex flex-col gap-4" style={{ maxWidth: 560 }}>
      <Alert
        intent="warning"
        variant="outline"
        title="Unsaved changes"
        onClose={() => {}}
        actions={
          <>
            <Alert.Action href="#">Save</Alert.Action>
            <Alert.Action href="#">Discard</Alert.Action>
          </>
        }
      >
        You have unsaved changes that will be lost.
      </Alert>

      <Alert
        intent="success"
        variant="solid"
        horizontal
        title="Payment received"
        onClose={() => {}}
      >
        Your transaction completed successfully.
      </Alert>
    </div>
  ),
};

/** Compound parts for a custom layout; actions use the themed `Alert.Action` (Link). */
export const Compound: Story = {
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Alert.Root intent="danger" variant="outline">
        <Alert.Icon />
        <Alert.Content>
          <Alert.Text>
            <Alert.Title>Couldn’t save your changes</Alert.Title>
            <Alert.Body>Check your connection and try again.</Alert.Body>
          </Alert.Text>
          <Alert.Actions>
            <Alert.Action onClick={() => {}}>Retry</Alert.Action>
            <Alert.Action onClick={() => {}}>Dismiss</Alert.Action>
          </Alert.Actions>
        </Alert.Content>
        <Alert.Close onClick={() => {}} />
      </Alert.Root>
    </div>
  ),
};
