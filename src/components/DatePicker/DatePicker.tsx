import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../Icon/Icon';
import { useDropdown } from '../../lib/useDropdown';
import {
  WEEKDAYS,
  MONTH_NAMES,
  monthMatrix,
  toISODate,
  fromISODate,
  formatDisplayDate,
} from '../../lib/calendar';

export interface DatePickerProps {
  /** Controlled value, YYYY-MM-DD (`''`/`null` = empty). */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
  disabled?: boolean;
  /** Applied to the trigger input, so a `<label htmlFor>` focuses it. */
  id?: string;
  className?: string;
  'aria-describedby'?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const SIZE: Record<NonNullable<DatePickerProps['size']>, string> = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-base',
  lg: 'h-12 text-lg',
};

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());

/**
 * DatePicker — a date input with a keyboard-navigable calendar popover, built on
 * useDropdown. Arrow keys move by day/week, PageUp/Down by month, Enter/Space
 * selects, Escape closes. Value is local-time ISO (YYYY-MM-DD). Control-only and
 * FormField-compatible (the trigger input takes the `id`).
 */
export function DatePicker({
  value,
  defaultValue = '',
  onValueChange,
  placeholder = 'Select a date',
  size = 'md',
  invalid,
  disabled,
  id: idProp,
  className,
  ...aria
}: DatePickerProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string>(defaultValue ?? '');
  const selectedIso = (isControlled ? (value ?? '') : internal) || '';

  const { open, setOpen, toggle, rootRef } = useDropdown<HTMLDivElement>();
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const initial = fromISODate(selectedIso) ?? today;
  const [focus, setFocus] = useState<Date>(initial);
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  // On open, snap focus + view to the selected date (or today).
  useEffect(() => {
    if (!open) return;
    const base = fromISODate(selectedIso) ?? today;
    setFocus(base);
    setView({ year: base.getFullYear(), month: base.getMonth() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Move DOM focus to the focused day while the popover is open.
  useEffect(() => {
    if (!open) return;
    const iso = toISODate(focus);
    gridRef.current?.querySelector<HTMLElement>(`[data-iso="${iso}"]`)?.focus();
  }, [open, focus]);

  const commit = (d: Date) => {
    const iso = toISODate(d);
    if (!isControlled) setInternal(iso);
    onValueChange?.(iso);
    setOpen(false);
    inputRef.current?.focus();
  };

  const moveFocus = (d: Date) => {
    setFocus(d);
    if (d.getMonth() !== view.month || d.getFullYear() !== view.year)
      setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => addDays(focus, -focus.getDay()),
      End: () => addDays(focus, 6 - focus.getDay()),
      PageUp: () => addMonths(focus, -1),
      PageDown: () => addMonths(focus, 1),
    };
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      commit(focus);
    } else if (map[e.key]) {
      e.preventDefault();
      moveFocus(map[e.key]());
    }
  };

  const days = monthMatrix(view.year, view.month);
  const todayIso = toISODate(today);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <input
        ref={inputRef}
        id={idProp}
        type="text"
        role="combobox"
        readOnly
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        placeholder={placeholder}
        value={formatDisplayDate(selectedIso)}
        className={cn(
          'block w-full cursor-pointer rounded-md border bg-default pr-9 pl-3 text-body placeholder:text-muted',
          'outline-none transition-colors',
          'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--color-border-primary)]/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          invalid ? 'border-danger' : 'border-default',
          SIZE[size],
        )}
        onClick={() => !disabled && toggle()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        {...aria}
      />
      <span
        className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted"
        aria-hidden="true"
      >
        <Icon size={16}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </Icon>
      </span>
      {open ? (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute z-20 mt-1 rounded-md border border-default bg-default p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              className="flex size-8 items-center justify-center rounded-md text-body hover:bg-secondary"
              onClick={() => setView((v) => ({ ...addMonthView(v, -1) }))}
            >
              <Icon size={16}>
                <path d="m15 18-6-6 6-6" />
              </Icon>
            </button>
            <span className="text-sm font-semibold text-heading">
              {MONTH_NAMES[view.month]} {view.year}
            </span>
            <button
              type="button"
              aria-label="Next month"
              className="flex size-8 items-center justify-center rounded-md text-body hover:bg-secondary"
              onClick={() => setView((v) => ({ ...addMonthView(v, 1) }))}
            >
              <Icon size={16}>
                <path d="m9 18 6-6-6-6" />
              </Icon>
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-muted">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div
            ref={gridRef}
            role="grid"
            className="grid grid-cols-7 gap-1"
            onKeyDown={onGridKeyDown}
          >
            {days.map((d) => {
              const isSelected = d.iso === selectedIso;
              const isToday = d.iso === todayIso;
              const isFocus = d.iso === toISODate(focus);
              return (
                <button
                  key={d.iso}
                  type="button"
                  role="gridcell"
                  data-iso={d.iso}
                  tabIndex={isFocus ? 0 : -1}
                  aria-selected={isSelected || undefined}
                  aria-current={isToday ? 'date' : undefined}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-md text-sm outline-none',
                    'focus-visible:ring-2 focus-visible:ring-[var(--color-border-primary)]/40',
                    !d.inMonth && 'text-muted',
                    isSelected
                      ? 'bg-primary text-heading_on-primary'
                      : cn(isToday && 'border border-default', 'hover:bg-secondary'),
                  )}
                  onClick={() => commit(d.date)}
                >
                  {d.day}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Shift a {year,month} view by `n` months (handles year rollover). */
function addMonthView({ year, month }: { year: number; month: number }, n: number) {
  const m = month + n;
  return { year: year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
}
