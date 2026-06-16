import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/* ----------------------------------------------------------------- Section */

export const sectionPaddingY = ['none', 'sm', 'md', 'lg', 'xl'] as const;
export type SectionPaddingY = (typeof sectionPaddingY)[number];

const PADDING_Y: Record<SectionPaddingY, string> = {
  none: 'py-0',
  sm: 'py-4',
  md: 'py-6',
  lg: 'py-10',
  xl: 'py-16',
};

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Vertical padding tier. Default `md` (24px). Use `none` for full-bleed. */
  paddingY?: SectionPaddingY;
}

/**
 * Section — a full-bleed page region. Sets vertical padding; wrap children in
 * `<Section.Container>` for the centered content rail, then place `<Row>`s inside.
 */
export function Section({ paddingY = 'md', className, children, ...rest }: SectionProps) {
  return (
    <section className={cn('w-full', PADDING_Y[paddingY], className)} {...rest}>
      {children}
    </section>
  );
}

/* ------------------------------------------------------- Section.Container */

export type SectionContainerProps = HTMLAttributes<HTMLDivElement>;

/** Centered content rail (max-width + horizontal gutter) inside a `<Section>`. */
function SectionContainer({ className, children, ...rest }: SectionContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-6', className)} {...rest}>
      {children}
    </div>
  );
}

Section.Container = SectionContainer;

/* --------------------------------------------------------------------- Row */

export type RowProps = HTMLAttributes<HTMLDivElement>;

/**
 * Row — a 12-column CSS grid with a 24px column gap. Place `<Column>`s inside and
 * position them with `variant` or Tailwind grid utilities (`col-start-*`, `col-span-*`).
 */
export function Row({ className, children, ...rest }: RowProps) {
  return (
    <div className={cn('grid grid-cols-12 gap-6', className)} {...rest}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Column */

export const columnVariants = ['centered', 'centered-wide', 'side', 'main'] as const;
export type ColumnVariant = (typeof columnVariants)[number];

const COLUMN_CLASS: Record<ColumnVariant, string> = {
  centered: 'col-start-4 col-span-6',
  'centered-wide': 'col-start-3 col-span-8',
  side: 'col-start-2 col-span-3',
  main: 'col-start-5 col-span-7',
};

export interface ColumnProps extends HTMLAttributes<HTMLDivElement> {
  /** Canonical 12-col placement; omit for a full-row column. */
  variant?: ColumnVariant;
}

/**
 * Column — a content cell in a `<Row>`. Defaults to spanning all 12 columns; pass
 * `variant` for a canonical placement, or Tailwind grid utilities via `className`.
 */
export function Column({ variant, className, children, ...rest }: ColumnProps) {
  return (
    <div className={cn(variant ? COLUMN_CLASS[variant] : 'col-span-12', className)} {...rest}>
      {children}
    </div>
  );
}
