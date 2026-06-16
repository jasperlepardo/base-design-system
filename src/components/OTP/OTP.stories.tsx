import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { OTP } from './OTP';
import { FormField } from '../Field/Field';

const meta = {
  title: 'Components/OTP',
  component: OTP,
  tags: ['autodocs'],
  args: { length: 6, numeric: true },
} satisfies Meta<typeof OTP>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

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
