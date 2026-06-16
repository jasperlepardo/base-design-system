import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MultiSelect, type MultiSelectOption } from './MultiSelect';
import { FormField } from '../Field/Field';

const OPTIONS: MultiSelectOption[] = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'angular', label: 'Angular' },
  { value: 'solid', label: 'Solid' },
  { value: 'qwik', label: 'Qwik', disabled: true },
];

const meta = {
  title: 'Components/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
  args: { options: OPTIONS, placeholder: 'Pick frameworks…', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 320 }}>
      <MultiSelect {...args} />
    </div>
  ),
};

export const InFormField: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(['react']);
    return (
      <div style={{ width: 320 }}>
        <FormField label="Frameworks" hint="Type to filter; Backspace removes the last chip.">
          {(props) => (
            <MultiSelect {...props} options={OPTIONS} value={value} onValueChange={setValue} />
          )}
        </FormField>
      </div>
    );
  },
};
