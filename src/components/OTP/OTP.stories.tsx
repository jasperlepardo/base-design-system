import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { OTP } from './OTP';
import { FormField } from '../Field/Field';

const meta = {
  title: 'Components/OTP',
  component: OTP,
  tags: ['autodocs'],
  args: { length: 6, numeric: true },
  argTypes: {
    length: { control: { type: 'number', min: 1, max: 12 } },
    numeric: { control: 'boolean' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof OTP>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const boxes = canvas.getAllByLabelText(/Character/i);
    await expect(boxes).toHaveLength(6);
    await userEvent.type(boxes[0], '1');
    await userEvent.type(boxes[1], '2');
    await userEvent.type(boxes[2], '3');
    await expect(boxes[0]).toHaveValue('1');
    await expect(boxes[1]).toHaveValue('2');
    await expect(boxes[2]).toHaveValue('3');
  },
};

export const InFormField: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div style={{ maxWidth: 360 }}>
        <FormField label="Verification code" hint="Enter the 6-digit code we sent you.">
          {(props) => <OTP {...props} value={value} onValueChange={setValue} />}
        </FormField>
      </div>
    );
  },
};
