import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type FooterProps = HTMLAttributes<HTMLElement>;

/**
 * Footer — a generic page-chrome footer: a full-bleed `<footer>` surface with a
 * top border and muted caption text. Wrap content in `<Footer.Container>` for the
 * centered rail. Compose any layout inside (regulatory copy, links, version, …).
 * Inside a `<Page>`, it pins to the bottom on short pages.
 */
export function Footer({ className, children, ...rest }: FooterProps) {
  return (
    <footer
      className={cn('w-full border-t border-line py-6 text-sm text-muted', className)}
      {...rest}
    >
      {children}
    </footer>
  );
}

export type FooterContainerProps = HTMLAttributes<HTMLDivElement>;

/** Centered content rail (max-width + horizontal gutter) inside a `<Footer>`. */
function FooterContainer({ className, children, ...rest }: FooterContainerProps) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-6', className)} {...rest}>
      {children}
    </div>
  );
}

Footer.Container = FooterContainer;
