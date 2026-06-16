import {
  createContext,
  useContext,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../Icon/Icon';
import './alert.css'; // structure
import '../../styles/components/alert.css'; // generated colors (--alert-* per intent/style)

// Mirrors the Figma Alert (node 8919:4545): Intent × Style × isHorizontal. Colors
// come from tokens/components/alert.json (→ --alert-bg / -border / -icon /
// -heading / -body, the same shape as Figma's Alert/* component variables).
export const alertIntents = ['default', 'primary', 'success', 'warning', 'danger'] as const;
export type AlertIntent = (typeof alertIntents)[number];

export const alertStyles = ['solid', 'outline', 'transparent'] as const;
export type AlertStyle = (typeof alertStyles)[number];

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

const AlertContext = createContext<{ intent: AlertIntent }>({ intent: 'default' });

/* --------------------------------------------------------------- Alert.Root */

export interface AlertRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  intent?: AlertIntent;
  /** Visual style: filled / tinted+border / tinted. */
  variant?: AlertStyle;
  /** Inline layout (content + actions on one row). */
  horizontal?: boolean;
}

/** Root box; shares `intent` with descendants and selects colors via data-attrs. */
function AlertRoot({
  intent = 'default',
  variant = 'solid',
  horizontal = false,
  className,
  children,
  ...rest
}: AlertRootProps) {
  return (
    <AlertContext.Provider value={{ intent }}>
      <div
        role="alert"
        className={cn('jspr-alert', className)}
        data-intent={intent}
        data-style={variant}
        data-horizontal={horizontal || undefined}
        {...rest}
      >
        <div className="jspr-alert__container">{children}</div>
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

/** Leading status glyph (colored by the Root's intent/style via --alert-icon). */
function AlertIcon({ children, className }: AlertIconProps) {
  const { intent } = useContext(AlertContext);
  return (
    <span className={cn('jspr-alert__icon', className)}>{children ?? DEFAULT_ICON[intent]}</span>
  );
}

/* -------------------------------------------------- Alert.Content / Text / … */

export interface AlertSlotProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/** Content column: groups the text block and the actions (row when horizontal). */
function AlertContent({ className, children, ...rest }: AlertSlotProps) {
  return (
    <div className={cn('jspr-alert__main', className)} {...rest}>
      {children}
    </div>
  );
}

/** Text group: title + body. */
function AlertText({ className, children, ...rest }: AlertSlotProps) {
  return (
    <div className={cn('jspr-alert__text', className)} {...rest}>
      {children}
    </div>
  );
}

function AlertTitle({ className, children, ...rest }: AlertSlotProps) {
  return (
    <div className={cn('jspr-alert__title', className)} {...rest}>
      {children}
    </div>
  );
}

function AlertBody({ className, children, ...rest }: AlertSlotProps) {
  return (
    <div className={cn('jspr-alert__message', className)} {...rest}>
      {children}
    </div>
  );
}

function AlertActions({ className, children, ...rest }: AlertSlotProps) {
  return (
    <div className={cn('jspr-alert__actions', className)} {...rest}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------- Alert.Action */

export interface AlertActionProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: ReactNode;
}

/**
 * Default Alert action — a link-styled control that inherits the Alert's intent
 * color (`--alert-icon`). Pass `href` for navigation or `onClick` for an action.
 */
function AlertAction({ className, children, ...rest }: AlertActionProps) {
  return (
    <a className={cn('jspr-alert__action', className)} {...rest}>
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
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn('jspr-alert__close', className)}
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
 * transparent) drive themed colors via `--alert-*` tokens; `horizontal` switches
 * the inline layout; `actions` and `onClose` (dismiss ×) are optional, with a
 * per-intent status icon by default. Mirrors the Figma Alert. This is a
 * convenience wrapper over the compound parts (`Alert.Root` / `Alert.Icon` /
 * `Alert.Title` / `Alert.Body` / `Alert.Actions` + `Alert.Action` / `Alert.Close`).
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
