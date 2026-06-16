import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Combobox, type ComboboxOption } from './Combobox';
import { FormField } from '../Field/Field';

const OPTIONS: ComboboxOption[] = [
  { value: 'ph', label: 'Philippines' },
  { value: 'sg', label: 'Singapore' },
  { value: 'jp', label: 'Japan' },
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'au', label: 'Australia', disabled: true },
];

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  args: { options: OPTIONS, placeholder: 'Search a country…', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 280 }}>
      <Combobox {...args} />
    </div>
  ),
};

export const InFormField: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <div style={{ width: 280 }}>
        <FormField label="Country" hint="Type to filter.">
          {(props) => (
            <Combobox {...props} options={OPTIONS} value={value} onValueChange={setValue} />
          )}
        </FormField>
      </div>
    );
  },
};
