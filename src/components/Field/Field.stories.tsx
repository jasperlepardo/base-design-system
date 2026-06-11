import type { Meta, StoryObj } from '@storybook/react';
import { FormField, TextField } from './Field';

const meta = {
  title: 'Components/Field',
  component: TextField,
  tags: ['autodocs'],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLabelAndHint: Story = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <FormField label="Email" hint="We'll never share it." required>
        {(props) => <TextField type="email" placeholder="you@example.com" {...props} />}
      </FormField>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <FormField label="Username" error="That username is taken.">
        {(props) => <TextField defaultValue="jasper" {...props} />}
      </FormField>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3" style={{ maxWidth: 360 }}>
      <TextField size="sm" placeholder="Small" />
      <TextField size="md" placeholder="Medium" />
      <TextField size="lg" placeholder="Large" />
    </div>
  ),
};
