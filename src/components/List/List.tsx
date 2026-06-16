import type { ElementType, HTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Divider } from '../Divider/Divider';
import './list.css';

/** List.Item title/value layouts (Figma List Item › Type). */
export const listVariants = ['inline', 'stacked', 'stacked-value'] as const;
export type ListVariant = (typeof listVariants)[number];

/* -------------------------------------------------------------------- List */

export interface ListProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

/**
 * List — the outer container (a `<div>`). Stacks `List.Section`s (header + group)
 * and/or bare `List.Group`s. For a flat list, use a `List.Group` on its own.
 * Compose rows with `List.Item`'s convenience props (`leading`/`title`/`content`/
 * `trailing`) or the slot parts (`List.Leading`, `List.Content`, …).
 */
export function List({ className, children, ...rest }: ListProps) {
  return (
    <div className={cn('jspr-list', className)} {...rest}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------- List.Group */

export interface ListGroupProps extends HTMLAttributes<HTMLUListElement> {
  /** Draw a hairline divider between items (never after the last one). */
  divider?: boolean;
  children?: ReactNode;
}

/** List.Group — the `<ul role="list">` of `List.Item` rows. */
export function ListGroup({ divider = false, className, children, ...rest }: ListGroupProps) {
  return (
    <ul
      className={cn('jspr-list__group', className)}
      data-divider={divider || undefined}
      role="list"
      {...rest}
    >
      {children}
    </ul>
  );
}

/* --------------------------------------------------------------- Row slots */

export interface ListSlotProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
}

/** Media slot — fixed leading/trailing content (icon, badge, chevron). */
function ListMedia({ className, children, ...rest }: ListSlotProps) {
  return (
    <span className={cn('jspr-list__media', className)} {...rest}>
      {children}
    </span>
  );
}

export interface ListContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Title/value layout. */
  variant?: ListVariant;
  children?: ReactNode;
}

/** Content slot — the flex-1 column holding the title/value pair (or anything). */
function ListContent({ variant, className, children, ...rest }: ListContentProps) {
  return (
    <div className={cn('jspr-list__content', className)} data-variant={variant} {...rest}>
      {children}
    </div>
  );
}

function ListTitle({ className, children, ...rest }: ListSlotProps) {
  return (
    <span className={cn('jspr-list__title', className)} {...rest}>
      {children}
    </span>
  );
}

function ListValue({ className, children, ...rest }: ListSlotProps) {
  return (
    <span className={cn('jspr-list__value', className)} {...rest}>
      {children}
    </span>
  );
}

/* --------------------------------------------------------------- List.Item */

export interface ListItemProps extends Omit<HTMLAttributes<HTMLLIElement>, 'title' | 'content'> {
  /** Title/content layout: `inline` (default), `stacked`, or `stacked-value`. */
  variant?: ListVariant;
  /** Primary text — left in `inline`, top when stacked. */
  title?: ReactNode;
  /** Secondary text / value — right in `inline`, bottom when stacked. */
  content?: ReactNode;
  /** Leading slot — an `<Icon/>`, avatar, checkbox, etc. */
  leading?: ReactNode;
  /** Trailing slot — a chevron, `<Badge/>`, action, etc. */
  trailing?: ReactNode;
  /** Override the group's divider: `true` forces it on, `false` off; omit to inherit. */
  divider?: boolean;
  /** When set, the row becomes a `<button>` (or `<a>` if `href` is given). */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Renders the row as a link. */
  href?: string;
  /** Compose the row from slot parts instead of the convenience props. */
  children?: ReactNode;
}

/**
 * ListItem — a single row: optional leading/trailing media around a title/value
 * pair. Becomes an interactive `<button>`/`<a>` when `onClick`/`href` is set;
 * otherwise a plain row. Pass `children` to compose from slot parts.
 */
export function ListItem({
  variant = 'inline',
  title,
  content,
  leading,
  trailing,
  divider,
  onClick,
  href,
  className,
  children,
  ...rest
}: ListItemProps) {
  const interactive = Boolean(onClick || href);
  const RowTag: ElementType = href ? 'a' : interactive ? 'button' : 'div';
  const rowProps: Record<string, unknown> = {};
  if (onClick) rowProps.onClick = onClick;
  if (href) rowProps.href = href;
  else if (interactive) rowProps.type = 'button';

  return (
    <li
      className={cn('jspr-list__item', className)}
      data-divider={divider === undefined ? undefined : String(divider)}
      {...rest}
    >
      <RowTag className="jspr-list__row" data-interactive={interactive || undefined} {...rowProps}>
        {children != null ? (
          children
        ) : (
          <>
            {leading != null ? <ListMedia>{leading}</ListMedia> : null}
            {title != null || content != null ? (
              <ListContent variant={variant}>
                {title != null ? <ListTitle>{title}</ListTitle> : null}
                {content != null ? <ListValue>{content}</ListValue> : null}
              </ListContent>
            ) : null}
            {trailing != null ? <ListMedia>{trailing}</ListMedia> : null}
          </>
        )}
      </RowTag>
      <Divider className="jspr-list__divider" />
    </li>
  );
}

/* ----------------------------------------------------- Section / Header tiers */

export type ListSectionProps = HTMLAttributes<HTMLElement>;

/** List.Section — a titled group: a `List.Header` over a `List.Group`. */
function ListSection({ className, children, ...rest }: ListSectionProps) {
  return (
    <section className={cn('jspr-list__section', className)} {...rest}>
      {children}
    </section>
  );
}

export type ListHeadingLevel = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export interface ListHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Section heading text. */
  heading?: ReactNode;
  /** Optional sub-heading below the heading. */
  subHeading?: ReactNode;
  /** Heading element to render — defaults to `'h3'`. */
  as?: ListHeadingLevel;
}

/** List.Header — a section's heading and optional sub-heading. */
function ListHeader({
  heading,
  subHeading,
  as: Heading = 'h3',
  className,
  children,
  ...rest
}: ListHeaderProps) {
  return (
    <div className={cn('jspr-list__header', className)} {...rest}>
      {heading != null ? <Heading className="jspr-list__heading">{heading}</Heading> : null}
      {subHeading != null ? <p className="jspr-list__subheading">{subHeading}</p> : null}
      {children}
    </div>
  );
}

List.Section = ListSection;
List.Header = ListHeader;
List.Group = ListGroup;
List.Item = ListItem;
List.Leading = ListMedia;
List.Trailing = ListMedia;
List.Content = ListContent;
List.Title = ListTitle;
List.Value = ListValue;
