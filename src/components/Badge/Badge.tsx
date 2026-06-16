import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const badgeIntents = ['primary', 'default', 'success', 'warning', 'danger', 'info'] as const;
export type BadgeIntent = (typeof badgeIntents)[number];

export const badgeStyles = ['solid', 'soft', 'outline'] as const;
export type BadgeStyle = (typeof badgeStyles)[number];

export const badgeSizes = ['sm', 'md'] as const;
export type BadgeSize = (typeof badgeSizes)[number];

// [intent][style] → utility classes. Every class maps to a themed token.
const STYLE_CLASS: Record<BadgeIntent, Record<BadgeStyle, string>> = {
  primary: {
    solid: 'bg-primary text-on-primary',
    soft: 'bg-primary-subtle text-primary-subtle-fg',
    outline: 'text-primary border border-primary',
  },
  default: {
    solid: 'bg-heading text-inverse',
    soft: 'bg-canvas-muted text-heading',
    outline: 'text-body border border-line-strong',
  },
  success: {
    solid: 'bg-success text-on-success',
    soft: 'bg-success-subtle text-success-subtle-fg',
    outline: 'text-success border border-success',
  },
  warning: {
    solid: 'bg-warning text-on-warning',
    soft: 'bg-warning-subtle text-warning-subtle-fg',
    outline: 'text-warning border border-warning',
  },
  danger: {
    solid: 'bg-danger text-on-danger',
    soft: 'bg-danger-subtle text-danger-subtle-fg',
    outline: 'text-danger border border-danger',
  },
  info: {
    solid: 'bg-info text-on-info',
    soft: 'bg-info-subtle text-info-subtle-fg',
    outline: 'text-info border border-info',
  },
};

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: 'h-5 px-1.5 text-xs gap-1',
  md: 'h-6 px-2 text-sm gap-1',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  intent?: BadgeIntent;
  variant?: BadgeStyle;
  size?: BadgeSize;
  children?: ReactNode;
}

/** Badge — small status label across intents/styles/sizes. */
export function Badge({
  intent = 'default',
  variant = 'soft',
  size = 'md',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        STYLE_CLASS[intent][variant],
        SIZE_CLASS[size],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
