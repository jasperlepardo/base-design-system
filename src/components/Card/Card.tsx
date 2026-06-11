import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** raised adds a shadow; outline is flat with a border (default). */
  variant?: 'outline' | 'raised';
  children?: ReactNode;
}

/** Card — a themed surface container. Compose with Card.Header/Body/Footer. */
export function Card({ variant = 'outline', className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface text-body rounded-lg border border-line overflow-hidden',
        variant === 'raised' && 'shadow-md',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface CardSlotProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

function CardHeader({ className, children, ...rest }: CardSlotProps) {
  return (
    <div className={cn('px-5 pt-5 pb-3', className)} {...rest}>
      {children}
    </div>
  );
}

function CardBody({ className, children, ...rest }: CardSlotProps) {
  return (
    <div className={cn('px-5 py-3', className)} {...rest}>
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...rest }: CardSlotProps) {
  return (
    <div
      className={cn('px-5 pt-3 pb-5 flex items-center gap-2 border-t border-line-subtle', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg/[28px] font-semibold text-heading', className)} {...rest}>
      {children}
    </h3>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Title = CardTitle;
