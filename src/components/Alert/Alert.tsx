import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const alertIntents = ['info', 'success', 'warning', 'danger'] as const;
export type AlertIntent = (typeof alertIntents)[number];

const INTENT_CLASS: Record<AlertIntent, string> = {
  info: 'bg-info-subtle text-info-subtle-fg border-info',
  success: 'bg-success-subtle text-success-subtle-fg border-success',
  warning: 'bg-warning-subtle text-warning-subtle-fg border-warning',
  danger: 'bg-danger-subtle text-danger-subtle-fg border-danger',
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  intent?: AlertIntent;
  /** Optional leading icon (e.g. an <Icon>). */
  icon?: ReactNode;
  title?: ReactNode;
  children?: ReactNode;
}

/** Alert — contextual message banner; soft themed background per intent. */
export function Alert({ intent = 'info', icon, title, className, children, ...rest }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-md border p-4 text-sm/[20px]',
        INTENT_CLASS[intent],
        className,
      )}
      {...rest}
    >
      {icon ? <span className="flex-none pt-0.5">{icon}</span> : null}
      <div className="flex flex-col gap-1">
        {title ? <div className="font-semibold">{title}</div> : null}
        {children ? <div className="opacity-90">{children}</div> : null}
      </div>
    </div>
  );
}
