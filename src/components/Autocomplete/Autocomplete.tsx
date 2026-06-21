import { useId, useMemo, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Dropdown, DropdownItem } from '../Dropdown/Dropdown';
import { useDropdown } from '../../lib/useDropdown';
import { useListbox } from '../../lib/useListbox';

export interface AutocompleteSuggestion {
  value: string;
  label?: ReactNode;
  /** Plain text for matching (when `label` is a node). Defaults to `value`. */
  text?: string;
  disabled?: boolean;
}

export interface AutocompleteProps {
  /** Suggestions — plain strings or `{ value, label, text }`. */
  suggestions: Array<AutocompleteSuggestion | string>;
  /** Controlled free-text value. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (text: string) => void;
  /** Fired when a suggestion is chosen (Enter / click). */
  onSelect?: (value: string) => void;
  /** Filter suggestions by the current text (default). Off = caller pre-filters. */
  filter?: boolean;
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

const SIZE: Record<NonNullable<AutocompleteProps['size']>, string> = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-base',
  lg: 'h-12 text-lg',
};

const norm = (s: AutocompleteSuggestion | string): AutocompleteSuggestion =>
  typeof s === 'string' ? { value: s } : s;
const sugText = (s: AutocompleteSuggestion) =>
  s.text ?? (typeof s.label === 'string' ? s.label : s.value);

/**
 * Autocomplete — a free-text input with a suggestion list, built on the
 * Popover/Listbox foundation. The value is whatever the user types; suggestions
 * assist (↑/↓ + Enter or click fills the field). Unlike Combobox, the value is
 * not constrained to the suggestions. Control-only and FormField-compatible.
 */
export function Autocomplete({
  suggestions,
  value,
  defaultValue = '',
  onValueChange,
  onSelect,
  filter = true,
  placeholder,
  size = 'md',
  invalid,
  disabled,
  id: idProp,
  className,
  ...aria
}: AutocompleteProps) {
  const reactId = useId();
  const id = idProp ?? reactId;
  const listId = `${id}-listbox`;
  const getItemId = (i: number) => `${id}-opt-${i}`;

  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const text = isControlled ? value : internal;

  const { open, setOpen, rootRef } = useDropdown<HTMLDivElement>();

  const items = useMemo(() => suggestions.map(norm), [suggestions]);
  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase();
    return filter && q ? items.filter((s) => sugText(s).toLowerCase().includes(q)) : items;
  }, [items, text, filter]);

  const setText = (next: string) => {
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
  };
  const selectAt = (i: number) => {
    const s = filtered[i];
    if (!s || s.disabled) return;
    setText(sugText(s));
    onSelect?.(s.value);
    setOpen(false);
  };

  const { activeIndex, onKeyDown, activeId } = useListbox({
    itemCount: filtered.length,
    open,
    setOpen,
    onActivate: selectAt,
    getItemId,
    isDisabled: (i) => !!filtered[i]?.disabled,
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
        value={text}
        className={cn(
          'block w-full rounded-md border bg-default px-3 text-body placeholder:text-muted',
          'outline-none transition-colors',
          'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--color-border-primary)]/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          invalid ? 'border-danger' : 'border-default',
          SIZE[size],
        )}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        {...aria}
      />
      {open && filtered.length > 0 ? (
        <Dropdown id={listId}>
          {filtered.map((s, i) => (
            <DropdownItem
              key={s.value}
              id={getItemId(i)}
              active={i === activeIndex}
              disabled={s.disabled}
              onSelect={() => selectAt(i)}
            >
              {s.label ?? sugText(s)}
            </DropdownItem>
          ))}
        </Dropdown>
      ) : null}
    </div>
  );
}
