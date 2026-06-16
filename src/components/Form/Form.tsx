import type { FormHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

// Form composition layer — a pure layout primitive (like Section/Page): it adds
// no field behavior, only the vertical structure that assembles field primitives
// (TextField, Select, …) and Dividers. Spacing uses the semantic space scale via
// Tailwind gap utilities. Compound API:
//   <Form onSubmit={…}>
//     <Form.Section>
//       <Form.Header heading="…" subHeading="…" />
//       <Form.Group><TextField /></Form.Group>
//     </Form.Section>
//   </Form>

/* -------------------------------------------------------------------- Form */

export type FormProps = FormHTMLAttributes<HTMLFormElement>;

/** Form — a semantic `<form>` that stacks `Form.Section`s (and `Divider`s). */
export function Form({ className, children, ...rest }: FormProps) {
  return (
    <form className={cn('flex flex-col gap-10', className)} {...rest}>
      {children}
    </form>
  );
}

/* ------------------------------------------------------------ Form.Section */

export type FormSectionProps = HTMLAttributes<HTMLElement>;

/** A titled group within a Form — a `Form.Header` over a `Form.Group`. */
function FormSection({ className, children, ...rest }: FormSectionProps) {
  return (
    <section className={cn('flex flex-col gap-6', className)} {...rest}>
      {children}
    </section>
  );
}

/* ---------------------------------------------------------- Form.Fieldset */

export type FormFieldsetProps = HTMLAttributes<HTMLFieldSetElement>;

/**
 * Form.Fieldset — the semantic variant of `Form.Section`, rendered as a
 * `<fieldset>` for grouped inputs (radios, checkboxes). Pair with a `<legend>`.
 */
function FormFieldset({ className, children, ...rest }: FormFieldsetProps) {
  return (
    <fieldset className={cn('flex min-w-0 flex-col gap-6 border-0 p-0', className)} {...rest}>
      {children}
    </fieldset>
  );
}

/* ------------------------------------------------------------- Form.Header */

export type FormHeadingLevel = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface FormHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Section heading text. */
  heading?: ReactNode;
  /** Optional brand-colored sub-heading below the heading. */
  subHeading?: ReactNode;
  /** Heading element to render — defaults to `'h3'`. */
  as?: FormHeadingLevel;
}

/** Form.Header — a section's heading and optional brand sub-heading. */
function FormHeader({
  heading,
  subHeading,
  as: Heading = 'h3',
  className,
  children,
  ...rest
}: FormHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)} {...rest}>
      {heading != null ? (
        <Heading className="text-lg font-semibold text-heading">{heading}</Heading>
      ) : null}
      {subHeading != null ? <p className="text-sm text-muted">{subHeading}</p> : null}
      {children}
    </div>
  );
}

/* -------------------------------------------------------------- Form.Group */

export type FormGroupProps = HTMLAttributes<HTMLDivElement>;

/** Field Group — a vertical stack of fields (16px gap). */
function FormGroup({ className, children, ...rest }: FormGroupProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)} {...rest}>
      {children}
    </div>
  );
}

Form.Section = FormSection;
Form.Fieldset = FormFieldset;
Form.Header = FormHeader;
Form.Group = FormGroup;
