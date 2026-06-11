import type { ReactNode, SVGProps } from 'react';
import { cn } from '../../lib/cn';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** SVG inner content (paths). Drawn on a 0 0 24 24 viewBox by default. */
  children: ReactNode;
  /** Square pixel size. Default 24. */
  size?: number;
  /** Accessible label. When omitted the icon is hidden from a11y tree. */
  label?: string;
  /** viewBox, if your paths aren't on a 24×24 grid. */
  viewBox?: string;
}

/**
 * Icon — inline SVG sized by `size`, colored with `currentColor` so it follows
 * text color (and `--btn-text` inside buttons). Supply paths as children.
 */
export function Icon({
  children,
  size = 24,
  label,
  viewBox = '0 0 24 24',
  className,
  ...rest
}: IconProps) {
  return (
    <svg
      className={cn('jspr-icon', className)}
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      {children}
    </svg>
  );
}
