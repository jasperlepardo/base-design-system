import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { FormField, TextField, Textarea, Select, Checkbox, Radio, fieldSizes } from './Field';

const meta = {
  title: 'Components/Field',
  component: TextField,
  tags: ['autodocs'],
  args: { placeholder: 'Enter text…', size: 'md' },
  argTypes: {
    size: { control: 'inline-radio', options: fieldSizes },
    invalid: { control: 'boolean' },
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <TextField {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    await expect(input).toBeInTheDocument();
    await userEvent.type(input, 'hello');
    await expect(input).toHaveValue('hello');
  },
};

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

export const Controls: Story = {
  render: () => (
    <div className="flex flex-col gap-4" style={{ maxWidth: 360 }}>
      <FormField label="Country">
        {(props) => (
          <Select {...props} defaultValue="ph">
            <option value="ph">Philippines</option>
            <option value="sg">Singapore</option>
            <option value="jp">Japan</option>
          </Select>
        )}
      </FormField>
      <FormField label="Notes" hint="Optional.">
        {(props) => <Textarea placeholder="Add a note…" {...props} />}
      </FormField>
      <fieldset className="flex flex-col gap-2">
        <Checkbox defaultChecked>Email me updates</Checkbox>
        <Checkbox>Subscribe to newsletter</Checkbox>
        <Checkbox disabled>Unavailable option</Checkbox>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <Radio name="plan" defaultChecked>
          Starter
        </Radio>
        <Radio name="plan">Pro</Radio>
        <Radio name="plan" disabled>
          Enterprise (soon)
        </Radio>
      </fieldset>
    </div>
  ),
};
