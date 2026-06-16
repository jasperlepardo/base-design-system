// Base Design System — public entry.
// Importing this module also injects the compiled CSS (tokens + utilities).
import './styles/tailwind.css';

export { Button, buttonIntents, buttonStyles, buttonSizes } from './components/Button/Button';
export type {
  ButtonProps,
  ButtonIntent,
  ButtonStyle,
  ButtonSize,
} from './components/Button/Button';

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

export {
  IconButton,
  iconButtonIntents,
  iconButtonStyles,
  iconButtonSizes,
} from './components/IconButton/IconButton';
export type {
  IconButtonProps,
  IconButtonIntent,
  IconButtonStyle,
  IconButtonSize,
} from './components/IconButton/IconButton';

export { Divider } from './components/Divider/Divider';
export type { DividerProps } from './components/Divider/Divider';

export {
  ButtonGroup,
  buttonGroupOrientations,
  buttonGroupAligns,
} from './components/ButtonGroup/ButtonGroup';
export type {
  ButtonGroupProps,
  ButtonGroupOrientation,
  ButtonGroupAlign,
} from './components/ButtonGroup/ButtonGroup';

export {
  TextField,
  Textarea,
  Select,
  Checkbox,
  Radio,
  FormField,
  FormLabel,
} from './components/Field/Field';
export type {
  TextFieldProps,
  TextareaProps,
  SelectProps,
  CheckboxProps,
  RadioProps,
  FormFieldProps,
  FormLabelProps,
} from './components/Field/Field';

export { Page } from './components/Page/Page';
export type { PageProps } from './components/Page/Page';

export {
  Section,
  Row,
  Column,
  sectionPaddingY,
  columnVariants,
} from './components/Section/Section';
export type {
  SectionProps,
  SectionContainerProps,
  RowProps,
  ColumnProps,
  SectionPaddingY,
  ColumnVariant,
} from './components/Section/Section';

export { Form } from './components/Form/Form';
export type {
  FormProps,
  FormSectionProps,
  FormFieldsetProps,
  FormHeaderProps,
  FormGroupProps,
  FormHeadingLevel,
} from './components/Form/Form';

export { Image, imageRatios } from './components/Image/Image';
export type { ImageProps, ImageRatio } from './components/Image/Image';

export { OTP } from './components/OTP/OTP';
export type { OTPProps } from './components/OTP/OTP';

export { Dropdown, DropdownItem } from './components/Dropdown/Dropdown';
export type { DropdownProps, DropdownItemProps } from './components/Dropdown/Dropdown';

export { Combobox } from './components/Combobox/Combobox';
export type { ComboboxProps, ComboboxOption } from './components/Combobox/Combobox';

export { MultiSelect } from './components/MultiSelect/MultiSelect';
export type { MultiSelectProps, MultiSelectOption } from './components/MultiSelect/MultiSelect';

export { Autocomplete } from './components/Autocomplete/Autocomplete';
export type {
  AutocompleteProps,
  AutocompleteSuggestion,
} from './components/Autocomplete/Autocomplete';

export { DatePicker } from './components/DatePicker/DatePicker';
export type { DatePickerProps } from './components/DatePicker/DatePicker';

export { Footer } from './components/Footer/Footer';
export type { FooterProps, FooterContainerProps } from './components/Footer/Footer';

export { useDropdown } from './lib/useDropdown';
export { useListbox } from './lib/useListbox';
export type { UseListboxOptions, UseListboxResult } from './lib/useListbox';

export { List, ListGroup, ListItem, listVariants } from './components/List/List';
export type {
  ListProps,
  ListGroupProps,
  ListItemProps,
  ListContentProps,
  ListSlotProps,
  ListSectionProps,
  ListHeaderProps,
  ListVariant,
  ListHeadingLevel,
} from './components/List/List';

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
