import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import {
  buttonIntents,
  buttonStyles,
  buttonSizes,
  type ButtonIntent,
  type ButtonStyle,
  type ButtonSize,
} from '../../tokens/generated/button.manifest';
import '../../styles/components/button.css';

export { buttonIntents, buttonStyles, buttonSizes };
export type { ButtonIntent, ButtonStyle, ButtonSize };

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  /** Color intent. */
  intent?: ButtonIntent;
  /** Visual style. */
  variant?: ButtonStyle;
  /** Size. */
  size?: ButtonSize;
  /** Leading icon slot. */
  leadingIcon?: ReactNode;
  /** Trailing icon slot. */
  trailingIcon?: ReactNode;
  children?: ReactNode;
}

/**
 * Button — driven by the component-token tier. `intent`, `variant`, and `size`
 * become data-attributes that select generated CSS rules; every value resolves
 * through themed CSS vars, so the button re-themes across light/dark and has
 * real :hover / :focus-visible / :disabled states.
 */
export function Button({
  intent = 'primary',
  variant = 'solid',
  size = 'md',
  type = 'button',
  className,
  leadingIcon,
  trailingIcon,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn('jspr-btn', className)}
      data-intent={intent}
      data-style={variant}
      data-size={size}
      {...rest}
    >
      {leadingIcon ? <span className="jspr-btn__icon">{leadingIcon}</span> : null}
      {children != null ? <span className="jspr-btn__content">{children}</span> : null}
      {trailingIcon ? <span className="jspr-btn__icon">{trailingIcon}</span> : null}
    </button>
  );
}
