import { useId, useMemo, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../Icon/Icon';
import { Dropdown, DropdownItem } from '../Dropdown/Dropdown';
import { useDropdown } from '../../lib/useDropdown';
import { useListbox } from '../../lib/useListbox';

export interface ComboboxOption {
  value: string;
  label?: ReactNode;
  /** Plain text for filtering + the closed display (when `label` is a node). */
  text?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  /** Controlled selected value (`null` = none). */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  disabled?: boolean;
  /** Applied to the input, so a `<label htmlFor>` focuses it. */
  id?: string;
  className?: string;
  'aria-describedby'?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const SIZE: Record<NonNullable<ComboboxProps['size']>, string> = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-base',
  lg: 'h-12 text-lg',
};

const optText = (o: ComboboxOption) => o.text ?? (typeof o.label === 'string' ? o.label : o.value);

/**
 * Combobox — a searchable, single-select combobox built on the Popover/Listbox
 * foundation (useDropdown + useListbox + Dropdown). Type to filter; ↑/↓ + Enter
 * to choose; Escape / outside-click to close. Control-only and
 * FormField-compatible (the input takes the `id`; `aria-*` pass through).
 */
export function Combobox({
  options,
  value,
  defaultValue = null,
  onValueChange,
  placeholder,
  size = 'md',
  invalid,
  disabled,
  id: idProp,
  className,
  ...aria
}: ComboboxProps) {
  const reactId = useId();
  const id = idProp ?? reactId;
  const listId = `${id}-listbox`;
  const getItemId = (i: number) => `${id}-opt-${i}`;

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const selected = isControlled ? value : internal;

  const { open, setOpen, rootRef } = useDropdown<HTMLDivElement>();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => optText(o).toLowerCase().includes(q)) : options;
  }, [options, query]);

  const selectedOption = options.find((o) => o.value === selected) ?? null;
  const display = open ? query : selectedOption ? optText(selectedOption) : '';

  const commit = (next: string | null) => {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  };
  const selectAt = (i: number) => {
    const o = filtered[i];
    if (!o || o.disabled) return;
    commit(o.value);
    setQuery('');
    setOpen(false);
  };

  const { activeIndex, onKeyDown, activeId } = useListbox({
    itemCount: filtered.length,
    open,
    setOpen,
    onActivate: selectAt,
    getItemId,
    isDisabled: (i) => !!filtered[i]?.disabled,
    selectedIndex: filtered.findIndex((o) => o.value === selected),
  });

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={display}
        className={cn(
          'block w-full rounded-md border bg-surface pr-9 pl-3 text-body placeholder:text-muted',
          'outline-none transition-colors',
          'focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          invalid ? 'border-danger' : 'border-line',
          SIZE[size],
        )}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          if (!disabled) {
            setQuery('');
            setOpen(true);
          }
        }}
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        {...aria}
      />
      <span
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted"
        aria-hidden="true"
      >
        <Icon size={16}>
          <path d="m6 9 6 6 6-6" />
        </Icon>
      </span>
      {open ? (
        <Dropdown id={listId}>
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted">No results</div>
          ) : (
            filtered.map((o, i) => (
              <DropdownItem
                key={o.value}
                id={getItemId(i)}
                selected={o.value === selected}
                active={i === activeIndex}
                disabled={o.disabled}
                onSelect={() => selectAt(i)}
              >
                {o.label ?? optText(o)}
              </DropdownItem>
            ))
          )}
        </Dropdown>
      ) : null}
    </div>
  );
}
