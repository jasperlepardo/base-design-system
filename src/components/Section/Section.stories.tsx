import type { Meta, StoryObj } from '@storybook/react';
import { Section, Row, Column } from './Section';

const meta = {
  title: 'Layout/Section',
  component: Section,
  tags: ['autodocs'],
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

const Cell = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-md bg-secondary p-4 text-center text-sm text-body">{children}</div>
);

export const Grid: Story = {
  render: () => (
    <Section>
      <Section.Container>
        <Row>
          <Column variant="centered">
            <Cell>centered — cols 4–9</Cell>
          </Column>
        </Row>
        <Row className="mt-4">
          <Column className="col-span-4">
            <Cell>col-span-4</Cell>
          </Column>
          <Column className="col-span-4">
            <Cell>col-span-4</Cell>
          </Column>
          <Column className="col-span-4">
            <Cell>col-span-4</Cell>
          </Column>
        </Row>
      </Section.Container>
    </Section>
  ),
};
