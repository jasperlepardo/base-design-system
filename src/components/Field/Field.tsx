import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type LabelHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';
import { fieldSizes, type FieldSize } from '../../tokens/generated/field.manifest';
import '../../styles/components/field.css'; // generated colors + sizing vars
import './field.css'; // structure

export { fieldSizes };
export type { FieldSize };

/* ---------------------------------------------------------------- TextField */

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: FieldSize;
  invalid?: boolean;
}

/** TextField — a themed text input. Use standalone or inside <FormField>. */
export function TextField({ size = 'md', invalid, className, ...rest }: TextFieldProps) {
  return (
    <input
      className={cn('jspr-field', className)}
      data-size={size}
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
    <label className={cn('jspr-field__label', className)} {...rest}>
      {children}
      {required ? <span className="jspr-field__required"> *</span> : null}
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
    <div className={cn('jspr-field-group', className)}>
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
        <p id={errorId} className="jspr-field__error">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="jspr-field__hint">
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
      className={cn('jspr-field jspr-field--multiline', className)}
      data-size="md"
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------------- Select */

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: FieldSize;
  invalid?: boolean;
}

/** Select — a themed native select. Pass <option>s as children. */
export function Select({ size = 'md', invalid, className, children, ...rest }: SelectProps) {
  return (
    <select
      className={cn('jspr-field', className)}
      data-size={size}
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
