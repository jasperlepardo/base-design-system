import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import './dropdown.css';

export interface DropdownProps {
  id?: string;
  /** ARIA role for the panel (default `listbox`). */
  role?: 'listbox' | 'menu';
  /** Sets `aria-multiselectable` (e.g. MultiSelect). */
  multiselectable?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Dropdown — the floating panel of a listbox/menu (the items container). Pair
 * with `useDropdown` (open/close, outside-click, Escape) and `useListbox`
 * (keyboard model). Render it inside a `position: relative` root that also holds
 * the trigger.
 */
export function Dropdown({
  id,
  role = 'listbox',
  multiselectable,
  className,
  children,
}: DropdownProps) {
  return (
    <div
      id={id}
      role={role}
      aria-multiselectable={multiselectable || undefined}
      className={cn('jspr-dropdown', className)}
    >
      {children}
    </div>
  );
}

export interface DropdownItemProps {
  id?: string;
  selected?: boolean;
  /** Keyboard-highlighted (drives `aria-activedescendant` styling). */
  active?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  className?: string;
  children: ReactNode;
}

/**
 * DropdownItem — a single selectable row. Uses `onMouseDown` + preventDefault so
 * selecting doesn't blur (and close) the trigger before the handler runs.
 */
export function DropdownItem({
  id,
  selected,
  active,
  disabled,
  onSelect,
  className,
  children,
}: DropdownItemProps) {
  return (
    <div
      id={id}
      role="option"
      aria-selected={selected || undefined}
      aria-disabled={disabled || undefined}
      data-active={active ? 'true' : undefined}
      className={cn('jspr-dropdown__item', className)}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onSelect?.();
      }}
    >
      {children}
    </div>
  );
}
