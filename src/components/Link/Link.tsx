import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const linkTones = ['primary', 'default'] as const;
export type LinkTone = (typeof linkTones)[number];

const TONE_CLASS: Record<LinkTone, string> = {
  primary: 'text-link hover:text-primary-hover',
  default: 'text-body hover:text-heading',
};

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  tone?: LinkTone;
  /** Show the underline only on hover (default) or always. */
  underline?: 'hover' | 'always';
  children?: ReactNode;
}

/** Link — themed anchor with focus-visible ring. */
export function Link({
  tone = 'primary',
  underline = 'hover',
  className,
  children,
  ...rest
}: LinkProps) {
  return (
    <a
      className={cn(
        'rounded-sm underline-offset-2 transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        underline === 'always' ? 'underline' : 'no-underline hover:underline',
        TONE_CLASS[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}
