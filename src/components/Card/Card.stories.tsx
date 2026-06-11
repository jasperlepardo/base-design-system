import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Button } from '../Button/Button';
import { Text } from '../Text/Text';
import { Badge } from '../Badge/Badge';

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: { variant: { control: 'inline-radio', options: ['outline', 'raised'] } },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: 'outline' },
  render: (args) => (
    <Card {...args} style={{ maxWidth: 360 }}>
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title>Project Atlas</Card.Title>
          <Badge intent="success" variant="soft">
            Active
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <Text variant="small" tone="muted">
          A composable surface built from semantic tokens — it re-themes in dark mode without any
          per-component change.
        </Text>
      </Card.Body>
      <Card.Footer>
        <Button size="sm">Open</Button>
        <Button size="sm" intent="neutral" variant="ghost">
          Dismiss
        </Button>
      </Card.Footer>
    </Card>
  ),
};
