import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Autocomplete } from './Autocomplete';
import { FormField } from '../Field/Field';

const FRUITS = [
  'Apple',
  'Apricot',
  'Banana',
  'Blackberry',
  'Blueberry',
  'Cherry',
  'Cranberry',
  'Date',
  'Grape',
  'Mango',
];

const meta = {
  title: 'Components/Autocomplete',
  component: Autocomplete,
  tags: ['autodocs'],
  args: { suggestions: FRUITS, placeholder: 'Type a fruit…', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof Autocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 280 }}>
      <Autocomplete {...args} />
    </div>
  ),
};

export const InFormField: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div style={{ width: 280 }}>
        <FormField label="Favorite fruit" hint="Free text — suggestions assist.">
          {(props) => (
            <Autocomplete {...props} suggestions={FRUITS} value={value} onValueChange={setValue} />
          )}
        </FormField>
      </div>
    );
  },
};
