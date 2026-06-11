/**
 * Tiny classnames joiner — filters falsy values and joins with a space.
 * No dependency on clsx/tailwind-merge to keep the bundle lean.
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
