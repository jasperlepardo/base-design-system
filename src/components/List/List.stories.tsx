import type { Meta, StoryObj } from '@storybook/react';
import { List } from './List';
import { Badge } from '../Badge/Badge';

const meta = {
  title: 'Components/List',
  component: List,
  tags: ['autodocs'],
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <List.Group divider>
        <List.Item title="Account name" content="Jasper Lepardo" />
        <List.Item title="Account number" content="•••• 1234" />
        <List.Item title="Status" content={<Badge intent="success">Active</Badge>} />
      </List.Group>
    </div>
  ),
};

export const Sectioned: Story = {
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <List>
        <List.Section>
          <List.Header heading="Profile" subHeading="Your details" />
          <List.Group divider>
            <List.Item variant="stacked" title="Name" content="Jasper Lepardo" />
            <List.Item variant="stacked" title="Email" content="jsprlprd@gmail.com" />
          </List.Group>
        </List.Section>
        <List.Section>
          <List.Header heading="Actions" />
          <List.Group>
            <List.Item title="Open settings" onClick={() => {}} trailing="›" />
            <List.Item title="Sign out" onClick={() => {}} trailing="›" />
          </List.Group>
        </List.Section>
      </List>
    </div>
  ),
};
