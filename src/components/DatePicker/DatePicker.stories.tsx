import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DatePicker } from './DatePicker';
import { FormField } from '../Field/Field';

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  args: { placeholder: 'Select a date', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 280 }}>
      <DatePicker {...args} />
    </div>
  ),
};

export const InFormField: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div style={{ width: 280 }}>
        <FormField label="Birth date" hint="Arrow keys navigate; Enter selects.">
          {(props) => <DatePicker {...props} value={value} onValueChange={setValue} />}
        </FormField>
      </div>
    );
  },
};
