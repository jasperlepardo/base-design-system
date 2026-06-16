import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Icon } from '../Icon/Icon';
import {
  badgeIntents,
  badgeStyles,
  badgeSizes,
  type BadgeIntent,
  type BadgeStyle,
  type BadgeSize,
} from '../../tokens/generated/badge.manifest';
import '../../styles/components/badge.css'; // generated colors + sizing vars
import './badge.css'; // structure

export { badgeIntents, badgeStyles, badgeSizes };
export type { BadgeIntent, BadgeStyle, BadgeSize };

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'style'> {
  /** Color intent (maps to the Figma Badge intent). */
  intent?: BadgeIntent;
  /** Visual style (maps to the Figma Badge style). */
  variant?: BadgeStyle;
  /** Size (maps to the Figma Badge size). */
  size?: BadgeSize;
  /** Show the leading status dot (tinted by the intent's icon color). */
  dot?: boolean;
  /** Leading icon slot — typically an `<Icon>…</Icon>` (20px). */
  leadingIcon?: ReactNode;
  /** Trailing icon slot — typically an `<Icon>…</Icon>` (20px). */
  trailingIcon?: ReactNode;
  /** When provided, renders a dismiss (×) button. */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button. */
  dismissLabel?: string;
  children?: ReactNode;
}

/**
 * Badge — compact status/label pill. `intent`, `variant`, and `size` become
 * data-attributes that select generated CSS rules; every value resolves through
 * semantic CSS vars, so the badge re-themes across light/dark for free. The
 * optional dot, leading/trailing icons, and dismiss button mirror the Figma
 * Badge slots and all follow the intent's icon color.
 */
export function Badge({
  intent = 'default',
  variant = 'solid',
  size = 'medium',
  dot = false,
  leadingIcon,
  trailingIcon,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn('jspr-badge', className)}
      data-intent={intent}
      data-style={variant}
      data-size={size}
      {...rest}
    >
      {leadingIcon ? <span className="jspr-badge__icon">{leadingIcon}</span> : null}

      <span className="jspr-badge__content">
        {dot ? (
          <span className="jspr-badge__dot-wrap">
            <span className="jspr-badge__dot" />
          </span>
        ) : null}
        {children != null ? <span className="jspr-badge__label">{children}</span> : null}
      </span>

      {trailingIcon ? <span className="jspr-badge__icon">{trailingIcon}</span> : null}

      {onDismiss ? (
        <button
          type="button"
          className="jspr-badge__dismiss"
          onClick={onDismiss}
          aria-label={dismissLabel}
        >
          <Icon size={16} aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </Icon>
        </button>
      ) : null}
    </span>
  );
}
