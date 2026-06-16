import {
  createContext,
  useContext,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../Icon/Icon';

// Mirrors the Figma Alert variant axes (node 8919:4545): Intent × Style × isHorizontal.
export const alertIntents = ['default', 'primary', 'success', 'warning', 'danger'] as const;
export type AlertIntent = (typeof alertIntents)[number];

export const alertStyles = ['solid', 'outline', 'transparent'] as const;
export type AlertStyle = (typeof alertStyles)[number];

type Parts = { root: string; icon: string };

// [intent][style] → container + icon utility classes (literal strings so Tailwind
// detects them). Every class maps to a semantic token, so alerts re-theme and
// honor consumer role remaps.
const VARIANT: Record<AlertIntent, Record<AlertStyle, Parts>> = {
  default: {
    solid: { root: 'bg-heading text-inverse', icon: 'text-inverse' },
    outline: { root: 'bg-canvas-muted text-body border border-line-strong', icon: 'text-heading' },
    transparent: { root: 'bg-canvas-muted text-body', icon: 'text-heading' },
  },
  primary: {
    solid: { root: 'bg-primary text-on-primary', icon: 'text-on-primary' },
    outline: { root: 'bg-primary-subtle text-body border border-primary', icon: 'text-primary' },
    transparent: { root: 'bg-primary-subtle text-body', icon: 'text-primary' },
  },
  success: {
    solid: { root: 'bg-success text-on-success', icon: 'text-on-success' },
    outline: { root: 'bg-success-subtle text-body border border-success', icon: 'text-success' },
    transparent: { root: 'bg-success-subtle text-body', icon: 'text-success' },
  },
  warning: {
    solid: { root: 'bg-warning text-on-warning', icon: 'text-on-warning' },
    outline: { root: 'bg-warning-subtle text-body border border-warning', icon: 'text-warning' },
    transparent: { root: 'bg-warning-subtle text-body', icon: 'text-warning' },
  },
  danger: {
    solid: { root: 'bg-danger text-on-danger', icon: 'text-on-danger' },
    outline: { root: 'bg-danger-subtle text-body border border-danger', icon: 'text-danger' },
    transparent: { root: 'bg-danger-subtle text-body', icon: 'text-danger' },
  },
};

// Default status glyph per intent.
const DEFAULT_ICON: Record<AlertIntent, ReactNode> = {
  default: (
    <Icon size={20}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </Icon>
  ),
  primary: (
    <Icon size={20}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </Icon>
  ),
  success: (
    <Icon size={20}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Icon>
  ),
  warning: (
    <Icon size={20}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </Icon>
  ),
  danger: (
    <Icon size={20}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6M9 9l6 6" />
    </Icon>
  ),
};

interface AlertCtx {
  intent: AlertIntent;
  variant: AlertStyle;
  horizontal: boolean;
}
const AlertContext = createContext<AlertCtx>({
  intent: 'default',
  variant: 'solid',
  horizontal: false,
});
const useAlert = () => useContext(AlertContext);

/* --------------------------------------------------------------- Alert.Root */

export interface AlertRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  intent?: AlertIntent;
  /** Visual style: filled / tinted+border / tinted. */
  variant?: AlertStyle;
  /** Inline layout (content + actions on one row). */
  horizontal?: boolean;
}

/** Root box + flex row; shares `intent`/`variant`/`horizontal` with descendants. */
function AlertRoot({
  intent = 'default',
  variant = 'solid',
  horizontal = false,
  className,
  children,
  ...rest
}: AlertRootProps) {
  const parts = VARIANT[intent][variant];
  return (
    <AlertContext.Provider value={{ intent, variant, horizontal }}>
      <div role="alert" className={cn('rounded-md', parts.root, className)} {...rest}>
        <div
          className={cn(
            'flex gap-3 p-4 text-sm/[20px]',
            horizontal ? 'items-center' : 'items-start',
          )}
        >
          {children}
        </div>
      </div>
    </AlertContext.Provider>
  );
}

/* --------------------------------------------------------------- Alert.Icon */

export interface AlertIconProps {
  /** Override the glyph; defaults to the status icon for the Root's intent. */
  children?: ReactNode;
  className?: string;
}

/** Leading status glyph (colored by the Root's intent/variant). */
function AlertIcon({ children, className }: AlertIconProps) {
  const { intent, variant, horizontal } = useAlert();
  return (
    <span
      className={cn('flex-none', VARIANT[intent][variant].icon, !horizontal && 'pt-0.5', className)}
    >
      {children ?? DEFAULT_ICON[intent]}
    </span>
  );
}

/* -------------------------------------------------- Alert.Content / Text / … */

export interface AlertSlotProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/** Content column: groups the text block and the actions (row when horizontal). */
function AlertContent({ className, children, ...rest }: AlertSlotProps) {
  const { horizontal } = useAlert();
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 gap-3',
        horizontal ? 'flex-row items-center' : 'flex-col',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Text group: title + body, tightly spaced; takes the remaining width. */
function AlertText({ className, children, ...rest }: AlertSlotProps) {
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-1', className)} {...rest}>
      {children}
    </div>
  );
}

function AlertTitle({ className, children, ...rest }: AlertSlotProps) {
  const { variant } = useAlert();
  return (
    <div
      className={cn('font-semibold', variant !== 'solid' && 'text-heading', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

function AlertBody({ className, children, ...rest }: AlertSlotProps) {
  return (
    <div className={cn(className)} {...rest}>
      {children}
    </div>
  );
}

function AlertActions({ className, children, ...rest }: AlertSlotProps) {
  const { horizontal } = useAlert();
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', horizontal && 'flex-none', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------- Alert.Action */

export interface AlertActionProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode;
}

/**
 * Default Alert action — a semibold link-styled control that inherits the Alert's
 * intent color. Pass `href` for navigation or `onClick` for an action.
 */
function AlertAction({ className, children, ...rest }: AlertActionProps) {
  const { intent, variant } = useAlert();
  const color = variant === 'solid' ? '' : VARIANT[intent][variant].icon;
  return (
    <a
      className={cn(
        'cursor-pointer font-semibold underline-offset-2 hover:underline focus-visible:underline',
        color,
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}

/* -------------------------------------------------------------- Alert.Close */

export interface AlertCloseProps {
  onClick?: () => void;
  /** Accessible label for the dismiss button. */
  label?: string;
  className?: string;
}

function AlertClose({ onClick, label = 'Dismiss', className }: AlertCloseProps) {
  const { intent, variant, horizontal } = useAlert();
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex flex-none rounded-sm opacity-70 transition-opacity hover:opacity-100',
        'focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-current',
        VARIANT[intent][variant].icon,
        !horizontal && 'self-start',
        className,
      )}
    >
      <Icon size={16}>
        <path d="M18 6 6 18M6 6l12 12" />
      </Icon>
    </button>
  );
}

/* -------------------------------------------------- Convenience <Alert> ----- */

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  intent?: AlertIntent;
  /** Visual style: filled / tinted+border / tinted. */
  variant?: AlertStyle;
  /** Inline layout (title/message and actions on one row). */
  horizontal?: boolean;
  title?: ReactNode;
  /** Override the leading glyph; pass `null` to hide it. */
  icon?: ReactNode;
  /** Action slot — e.g. one or more `<Alert.Action>`. */
  actions?: ReactNode;
  /** When set, renders a dismiss (×) button. */
  onClose?: () => void;
  /** Accessible label for the dismiss button. */
  closeLabel?: string;
  /** Message body. */
  children?: ReactNode;
}

/**
 * Alert — a contextual status banner. `intent` × `variant` (solid/outline/
 * transparent) set the themed colors; `horizontal` switches the inline layout;
 * `actions` and `onClose` (dismiss ×) are optional, with a per-intent status icon
 * by default. Mirrors the Figma Alert. This is a convenience wrapper over the
 * compound parts — use `Alert.Root` / `Alert.Icon` / `Alert.Title` / `Alert.Body`
 * / `Alert.Actions` (+ `Alert.Action`) / `Alert.Close` directly for custom layouts.
 */
export function Alert({
  intent = 'default',
  variant = 'solid',
  horizontal = false,
  title,
  icon,
  actions,
  onClose,
  closeLabel,
  className,
  children,
  ...rest
}: AlertProps) {
  return (
    <Alert.Root
      intent={intent}
      variant={variant}
      horizontal={horizontal}
      className={className}
      {...rest}
    >
      {icon === null ? null : <Alert.Icon>{icon}</Alert.Icon>}
      <Alert.Content>
        {title || children ? (
          <Alert.Text>
            {title ? <Alert.Title>{title}</Alert.Title> : null}
            {children ? <Alert.Body>{children}</Alert.Body> : null}
          </Alert.Text>
        ) : null}
        {actions ? <Alert.Actions>{actions}</Alert.Actions> : null}
      </Alert.Content>
      {onClose ? <Alert.Close onClick={onClose} label={closeLabel} /> : null}
    </Alert.Root>
  );
}

Alert.Root = AlertRoot;
Alert.Icon = AlertIcon;
Alert.Content = AlertContent;
Alert.Text = AlertText;
Alert.Title = AlertTitle;
Alert.Body = AlertBody;
Alert.Actions = AlertActions;
Alert.Action = AlertAction;
Alert.Close = AlertClose;
