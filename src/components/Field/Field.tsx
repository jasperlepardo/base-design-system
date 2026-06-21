import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type LabelHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';

/* ---------------------------------------------------------------- TextField */

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
}

const FIELD_SIZE: Record<NonNullable<TextFieldProps['size']>, string> = {
  sm: 'h-8 px-2.5 text-sm',
  md: 'h-10 px-3 text-base',
  lg: 'h-12 px-3.5 text-lg',
};

/** TextField — a themed text input. Use standalone or inside <FormField>. */
export function TextField({ size = 'md', invalid, className, ...rest }: TextFieldProps) {
  return (
    <input
      className={cn(
        'block w-full rounded-md border bg-default text-body placeholder:text-muted',
        'transition-colors outline-none',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--color-border-primary)]/40',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        invalid ? 'border-danger' : 'border-default',
        FIELD_SIZE[size],
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

/* ----------------------------------------------------------------- FormLabel */

export interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children?: ReactNode;
}

export function FormLabel({ required, className, children, ...rest }: FormLabelProps) {
  return (
    <label className={cn('text-sm font-medium text-heading', className)} {...rest}>
      {children}
      {required ? <span className="text-danger"> *</span> : null}
    </label>
  );
}

/* ----------------------------------------------------------------- FormField */

export interface FormFieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  /** Render-prop receiving the wired a11y props for the control. */
  children: (controlProps: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    invalid?: boolean;
  }) => ReactNode;
}

/**
 * FormField — composes a label, control, and hint/error text, wiring `id`,
 * `aria-describedby`, and `aria-invalid` for you via a render prop.
 */
export function FormField({ label, hint, error, required, className, children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = cn(hint ? hintId : undefined, error ? errorId : undefined) || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <FormLabel htmlFor={id} required={required}>
          {label}
        </FormLabel>
      ) : null}
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        invalid: !!error,
      })}
      {error ? (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------------- Textarea */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

/** Textarea — a themed multi-line input. Use standalone or inside <FormField>. */
export function Textarea({ invalid, className, rows = 4, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'block w-full rounded-md border bg-default px-3 py-2 text-base text-body placeholder:text-muted',
        'transition-colors outline-none',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--color-border-primary)]/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid ? 'border-danger' : 'border-default',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------------- Select */

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  invalid?: boolean;
}

/** Select — a themed native select. Pass <option>s as children. */
export function Select({ size = 'md', invalid, className, children, ...rest }: SelectProps) {
  return (
    <select
      className={cn(
        'block w-full rounded-md border bg-default text-body',
        'transition-colors outline-none',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--color-border-primary)]/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid ? 'border-danger' : 'border-default',
        FIELD_SIZE[size],
        className,
      )}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}

/* ----------------------------------------------------------------- Checkbox */

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  /** Inline label rendered after the box. */
  children?: ReactNode;
}

/** Checkbox — a native checkbox with an optional inline label. */
export function Checkbox({ children, className, disabled, ...rest }: CheckboxProps) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-2',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <input type="checkbox" disabled={disabled} className="size-4 accent-primary" {...rest} />
      {children != null ? <span className="text-sm text-body">{children}</span> : null}
    </label>
  );
}

/* -------------------------------------------------------------------- Radio */

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Inline label rendered after the dot. */
  children?: ReactNode;
}

/** Radio — a native radio with an optional inline label. */
export function Radio({ children, className, disabled, ...rest }: RadioProps) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-2',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <input type="radio" disabled={disabled} className="size-4 accent-primary" {...rest} />
      {children != null ? <span className="text-sm text-body">{children}</span> : null}
    </label>
  );
}
