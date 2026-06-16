import type { Meta, StoryObj } from '@storybook/react';
import { Form } from './Form';
import { TextField, Select, FormField } from '../Field/Field';
import { Divider } from '../Divider/Divider';
import { ButtonGroup } from '../ButtonGroup/ButtonGroup';
import { Button } from '../Button/Button';

const meta = {
  title: 'Layout/Form',
  component: Form,
  tags: ['autodocs'],
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Composed: Story = {
  render: () => (
    <Form style={{ maxWidth: 480 }} onSubmit={(e) => e.preventDefault()}>
      <Form.Section>
        <Form.Header heading="Your details" subHeading="How we'll reach you" />
        <Form.Group>
          <FormField label="Full name">{(p) => <TextField {...p} />}</FormField>
          <FormField label="Email">{(p) => <TextField type="email" {...p} />}</FormField>
        </Form.Group>
      </Form.Section>
      <Divider />
      <Form.Section>
        <Form.Header heading="Preferences" />
        <Form.Group>
          <FormField label="Country">
            {(p) => (
              <Select {...p}>
                <option>Philippines</option>
                <option>Singapore</option>
              </Select>
            )}
          </FormField>
        </Form.Group>
      </Form.Section>
      <ButtonGroup>
        <Button intent="default" variant="ghost">
          Cancel
        </Button>
        <Button intent="primary" type="submit">
          Save
        </Button>
      </ButtonGroup>
    </Form>
  ),
};
