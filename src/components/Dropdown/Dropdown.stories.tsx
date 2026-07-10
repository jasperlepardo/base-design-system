import type { Meta, StoryObj } from '@storybook/react';
import { useId, useState } from 'react';
import { Dropdown, DropdownItem } from './Dropdown';
import { useDropdown } from '../../lib/useDropdown';
import { useListbox } from '../../lib/useListbox';
import { Button } from '../Button/Button';

const OPTIONS = ['Apple', 'Banana', 'Cherry', 'Dragonfruit', 'Elderberry'];

/** A select-only combobox composed from the foundation: useDropdown + useListbox + Dropdown. */
function SelectMenu() {
  const [value, setValue] = useState<string | null>(null);
  const { open, setOpen, toggle, rootRef } = useDropdown<HTMLDivElement>();
  const baseId = useId();
  const listId = `${baseId}-list`;
  const getItemId = (i: number) => `${baseId}-opt-${i}`;
  const selectedIndex = value ? OPTIONS.indexOf(value) : -1;

  const { activeIndex, onKeyDown, activeId } = useListbox({
    itemCount: OPTIONS.length,
    open,
    setOpen,
    onActivate: (i) => setValue(OPTIONS[i]),
    getItemId,
    getItemText: (i) => OPTIONS[i],
    selectedIndex,
  });

  return (
    <div ref={rootRef} style={{ position: 'relative', width: 240 }}>
      <Button
        intent="default"
        variant="outline"
        className="w-full justify-between"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeId}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        {value ?? 'Select a fruit'}
      </Button>
      {open ? (
        <Dropdown id={listId}>
          {OPTIONS.map((o, i) => (
            <DropdownItem
              key={o}
              id={getItemId(i)}
              selected={o === value}
              active={i === activeIndex}
              onSelect={() => {
                setValue(o);
                setOpen(false);
              }}
            >
              {o}
            </DropdownItem>
          ))}
        </Dropdown>
      ) : null}
    </div>
  );
}

const meta = {
  title: 'Components/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  args: { children: null },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Foundation demo — a working select built from useDropdown + useListbox + Dropdown. */
export const SelectMenuExample: Story = {
  render: () => <SelectMenu />,
};
