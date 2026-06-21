import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type DividerProps = HTMLAttributes<HTMLHRElement>;

/**
 * Divider — a 1px horizontal rule in the default border color. Full-width and
 * margin-free; the surrounding layout owns the spacing. Styled with the semantic
 * `bg-[var(--color-border-default)]` utility, so it re-themes across light/dark.
 */
export function Divider({ className, ...rest }: DividerProps) {
  return <hr className={cn('h-px w-full border-0 bg-[var(--color-border-default)]', className)} {...rest} />;
}
