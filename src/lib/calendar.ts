/** Small dependency-free calendar helpers for DatePicker. */

export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface CalendarDay {
  date: Date;
  day: number;
  /** Whether the day belongs to the displayed month (vs. spill-over). */
  inMonth: boolean;
  /** YYYY-MM-DD. */
  iso: string;
}

/** Local-time ISO date (YYYY-MM-DD), avoiding UTC offset surprises. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string to a local Date (or null). */
export function fromISODate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** 6×7 grid of days covering `month` (0–11) of `year`, Sunday-first. */
export function monthMatrix(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { date: d, day: d.getDate(), inMonth: d.getMonth() === month, iso: toISODate(d) };
  });
}

/** Human-readable date, e.g. "27 May 2026". Returns "" for empty/invalid. */
export function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}
