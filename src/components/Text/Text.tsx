import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const textVariants = [
  'display',
  'h1',
  'h2',
  'h3',
  'body',
  'small',
  'caption',
] as const;
export type TextVariant = (typeof textVariants)[number];

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TextTone = 'default' | 'heading' | 'muted' | 'primary' | 'danger' | 'success';

const VARIANT_CLASS: Record<TextVariant, string> = {
  display: 'text-4xl/[40px] font-semibold text-heading',
  h1: 'text-3xl/[36px] font-semibold text-heading',
  h2: 'text-2xl/[32px] font-semibold text-heading',
  h3: 'text-xl/[28px] font-semibold text-heading',
  body: 'text-base/[24px] text-body',
  small: 'text-sm/[20px] text-body',
  caption: 'text-xs/[16px] text-muted',
};

const DEFAULT_TAG: Record<TextVariant, ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  body: 'p',
  small: 'p',
  caption: 'span',
};

const WEIGHT_CLASS: Record<TextWeight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const TONE_CLASS: Record<TextTone, string> = {
  default: '',
  heading: 'text-heading',
  muted: 'text-muted',
  primary: 'text-primary',
  danger: 'text-danger',
  success: 'text-success',
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  weight?: TextWeight;
  tone?: TextTone;
  /** Override the rendered element. */
  as?: ElementType;
  children?: ReactNode;
}

/** Text — typographic scale mapped to semantic color/type tokens. */
export function Text({
  variant = 'body',
  weight,
  tone = 'default',
  as,
  className,
  children,
  ...rest
}: TextProps) {
  const Tag = as ?? DEFAULT_TAG[variant];
  return (
    <Tag
      className={cn(
        VARIANT_CLASS[variant],
        weight && WEIGHT_CLASS[weight],
        TONE_CLASS[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
