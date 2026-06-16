import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import './button-group.css';

export const buttonGroupOrientations = ['horizontal', 'stacked'] as const;
export type ButtonGroupOrientation = (typeof buttonGroupOrientations)[number];

export const buttonGroupAligns = ['start', 'center', 'end', 'between'] as const;
export type ButtonGroupAlign = (typeof buttonGroupAligns)[number];

export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Row (`horizontal`) or vertical (`stacked`, full-width buttons). */
  orientation?: ButtonGroupOrientation;
  /** Horizontal alignment (ignored when `fill` or `stacked`). Default `end`. */
  align?: ButtonGroupAlign;
  /** Stretch buttons to equal width. */
  fill?: boolean;
  children?: ReactNode;
}

/**
 * ButtonGroup — lays out 1–3 actions as a footer/CTA cluster. Put `Button`s (and
 * an optional `Link`) inside; the group owns spacing (`--space-md`), the
 * row↔stacked switch, and equal-width `fill`. It doesn't restyle the buttons —
 * they keep their own intents. `orientation`/`align`/`fill` become data-attributes
 * that select the generated `.jspr-button-group` rules.
 */
export function ButtonGroup({
  orientation = 'horizontal',
  align = 'end',
  fill = false,
  className,
  children,
  ...rest
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      className={cn('jspr-button-group', className)}
      data-orientation={orientation}
      data-align={align}
      data-fill={fill || undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
