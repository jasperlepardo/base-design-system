import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import './page.css';

export type PageProps = HTMLAttributes<HTMLDivElement>;

/**
 * Page — full-height app shell. Sets up a vertical flex column with an isolated
 * stacking context so a `<Navbar>` (a `<nav>`) placed inside sticks to the top
 * and a `<Footer>` (a `<footer>`) pins to the bottom on short pages. Place chrome
 * and content (Section) as direct children — no slot wrappers.
 */
export function Page({ className, children, ...rest }: PageProps) {
  return (
    <div className={cn('jspr-page', className)} {...rest}>
      {children}
    </div>
  );
}
