import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../Icon/Icon';
import { Dropdown, DropdownItem } from '../Dropdown/Dropdown';
import { useDropdown } from '../../lib/useDropdown';
import { useListbox } from '../../lib/useListbox';
import type { ComboboxOption } from '../Combobox/Combobox';

export type MultiSelectOption = ComboboxOption;

export interface MultiSelectProps {
  options: MultiSelectOption[];
  /** Controlled selected values. */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
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

const SIZE: Record<NonNullable<MultiSelectProps['size']>, string> = {
  sm: 'min-h-8 text-sm',
  md: 'min-h-10 text-base',
  lg: 'min-h-12 text-lg',
};

const optText = (o: MultiSelectOption) =>
  o.text ?? (typeof o.label === 'string' ? o.label : o.value);

/**
 * MultiSelect — a searchable multi-value combobox on the Popover/Listbox
 * foundation. Type to filter; ↑/↓ + Enter toggles options (the menu stays open);
 * picked values become removable chips; Backspace on an empty query removes the
 * last chip. Control-only and FormField-compatible (the input takes the `id`).
 */
export function MultiSelect({
  options,
  value,
  defaultValue = [],
  onValueChange,
  placeholder,
  size = 'md',
  invalid,
  disabled,
  id: idProp,
  className,
  ...aria
}: MultiSelectProps) {
  const reactId = useId();
  const id = idProp ?? reactId;
  const listId = `${id}-listbox`;
  const getItemId = (i: number) => `${id}-opt-${i}`;
  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string[]>(defaultValue);
  const selected = isControlled ? value : internal;

  const { open, setOpen, rootRef } = useDropdown<HTMLDivElement>();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => optText(o).toLowerCase().includes(q)) : options;
  }, [options, query]);

  const commit = (next: string[]) => {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  };
  const toggle = (val: string) =>
    commit(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);

  const toggleAt = (i: number) => {
    const o = filtered[i];
    if (!o || o.disabled) return;
    toggle(o.value);
    setQuery('');
  };

  const { activeIndex, onKeyDown, activeId } = useListbox({
    itemCount: filtered.length,
    open,
    setOpen,
    onActivate: toggleAt,
    getItemId,
    isDisabled: (i) => !!filtered[i]?.disabled,
    closeOnActivate: false,
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Backspace' && query === '' && selected.length) {
      commit(selected.slice(0, -1));
      return;
    }
    onKeyDown(e);
  };

  const selectedOptions = selected
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is MultiSelectOption => o != null);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex w-full flex-wrap items-center gap-1.5 rounded-md border bg-surface px-2 py-1',
          'transition-colors focus-within:border-focus focus-within:ring-2 focus-within:ring-focus/40',
          disabled && 'cursor-not-allowed opacity-50',
          invalid ? 'border-danger' : 'border-line',
          SIZE[size],
        )}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus();
            setOpen(true);
          }
        }}
      >
        {selectedOptions.map((o) => (
          <span
            key={o.value}
            className="inline-flex items-center gap-1 rounded bg-canvas-muted px-2 py-0.5 text-sm text-heading"
          >
            {o.label ?? optText(o)}
            <button
              type="button"
              aria-label={`Remove ${optText(o)}`}
              className="flex text-muted hover:text-heading"
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault();
                toggle(o.value);
              }}
            >
              <Icon size={12}>
                <path d="M18 6 6 18M6 6l12 12" />
              </Icon>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
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
          placeholder={selectedOptions.length === 0 ? placeholder : undefined}
          value={query}
          className="min-w-[4rem] flex-1 bg-transparent text-body placeholder:text-muted outline-none"
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          {...aria}
        />
      </div>
      {open ? (
        <Dropdown id={listId} multiselectable>
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted">No results</div>
          ) : (
            filtered.map((o, i) => (
              <DropdownItem
                key={o.value}
                id={getItemId(i)}
                selected={selected.includes(o.value)}
                active={i === activeIndex}
                disabled={o.disabled}
                onSelect={() => toggleAt(i)}
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
