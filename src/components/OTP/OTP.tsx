import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '../../lib/cn';

export interface OTPProps {
  /** Number of character boxes. Default 6. */
  length?: number;
  /** Controlled value (the concatenated characters). */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Fired on every change with the concatenated value. */
  onValueChange?: (value: string) => void;
  /** Fired once every box is filled. */
  onComplete?: (value: string) => void;
  /** Restrict input to digits (default) or allow any character. */
  numeric?: boolean;
  /** Error styling. */
  invalid?: boolean;
  disabled?: boolean;
  /** Applied to the first box, so a `<label htmlFor>` focuses the input. */
  id?: string;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

/**
 * OTP — a one-time-passcode input: a row of single-character boxes with
 * auto-advance, backspace-to-previous, arrow navigation, and paste-to-fill.
 * Control-only — wrap in `<FormField>` for a label / hint / error.
 */
export function OTP({
  length = 6,
  value,
  defaultValue,
  onValueChange,
  onComplete,
  numeric = true,
  invalid,
  disabled,
  id,
  className,
  ...aria
}: OTPProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? '');
  const current = (isControlled ? value : internal).slice(0, length);
  const chars = Array.from({ length }, (_, i) => current[i] ?? '');
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const update = (nextChars: string[]) => {
    const next = nextChars.join('');
    if (!isControlled) setInternal(next);
    onValueChange?.(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleChange = (i: number, raw: string) => {
    const char = raw.slice(-1);
    if (char && numeric && !/\d/.test(char)) return;
    const next = [...chars];
    next[i] = char;
    update(next);
    if (char && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const next = [...chars];
      if (chars[i]) {
        next[i] = '';
        update(next);
      } else if (i > 0) {
        e.preventDefault();
        next[i - 1] = '';
        update(next);
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    let data = e.clipboardData.getData('text');
    if (numeric) data = data.replace(/\D/g, '');
    if (!data) return;
    const next = [...chars];
    for (let k = 0; k < data.length && i + k < length; k += 1) next[i + k] = data[k];
    update(next);
    refs.current[Math.min(i + data.length, length - 1)]?.focus();
  };

  return (
    <div role="group" className={cn('flex gap-2', className)} {...aria}>
      {chars.map((c, i) => (
        <input
          key={i}
          id={i === 0 ? id : undefined}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={cn(
            'size-12 rounded-md border bg-default text-center text-lg text-body',
            'outline-none transition-colors',
            'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--color-border-primary)]/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            invalid ? 'border-danger' : 'border-default',
          )}
          value={c}
          maxLength={1}
          inputMode={numeric ? 'numeric' : 'text'}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          disabled={disabled}
          aria-label={`Character ${i + 1}`}
          aria-invalid={invalid || undefined}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
        />
      ))}
    </div>
  );
}
