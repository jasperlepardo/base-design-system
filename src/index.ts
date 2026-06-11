// Base Design System — public entry.
// Importing this module also injects the compiled CSS (tokens + utilities).
import './styles/tailwind.css';

export { Button, buttonIntents, buttonStyles, buttonSizes } from './components/Button/Button';
export type { ButtonProps, ButtonIntent, ButtonStyle, ButtonSize } from './components/Button/Button';

export { Text, textVariants } from './components/Text/Text';
export type { TextProps, TextVariant, TextWeight, TextTone } from './components/Text/Text';

export { Icon } from './components/Icon/Icon';
export type { IconProps } from './components/Icon/Icon';

export { Link, linkTones } from './components/Link/Link';
export type { LinkProps, LinkTone } from './components/Link/Link';

export { Badge, badgeIntents, badgeStyles, badgeSizes } from './components/Badge/Badge';
export type { BadgeProps, BadgeIntent, BadgeStyle, BadgeSize } from './components/Badge/Badge';

export { Card } from './components/Card/Card';
export type { CardProps, CardSlotProps } from './components/Card/Card';

export { Alert, alertIntents } from './components/Alert/Alert';
export type { AlertProps, AlertIntent } from './components/Alert/Alert';

export { TextField, FormField, FormLabel } from './components/Field/Field';
export type {
  TextFieldProps,
  FormFieldProps,
  FormLabelProps,
} from './components/Field/Field';

export { cn } from './lib/cn';
export type { ClassValue } from './lib/cn';

export {
  getThemeMode,
  setThemeMode,
  initTheme,
  resolveTheme,
  useTheme,
  themeScript,
  THEME_STORAGE_KEY,
} from './lib/theme';
export type { ThemeMode } from './lib/theme';

export * from './tokens';
