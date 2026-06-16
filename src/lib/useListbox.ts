import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface UseListboxOptions {
  itemCount: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Commit the item at `index` (Enter / Space on the active item). */
  onActivate: (index: number) => void;
  /** DOM id of item `index` — for `aria-activedescendant` + scroll-into-view. */
  getItemId: (index: number) => string;
  isDisabled?: (index: number) => boolean;
  /** Plain text of item `index`, enabling type-to-jump. */
  getItemText?: (index: number) => string;
  /** Item highlighted when the menu opens (e.g. the selected one). */
  selectedIndex?: number;
  /** Keep the menu open after activating (default closes). */
  closeOnActivate?: boolean;
}

export interface UseListboxResult {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  /** `aria-activedescendant` value for the trigger. */
  activeId: string | undefined;
}

/**
 * Keyboard model for a custom (div-based) listbox combobox, per the WAI-ARIA APG
 * select-only pattern: Arrow/Home/End movement (skipping disabled), Enter/Space
 * to activate, type-ahead, active-item-on-open, and scroll-into-view. Escape is
 * left to `useDropdown`. Works whether the trigger is a `<button>` or a
 * `<div role="combobox">` — it `preventDefault`s the keys it handles so a
 * button's native activation doesn't double-fire.
 */
export function useListbox({
  itemCount,
  open,
  setOpen,
  onActivate,
  getItemId,
  isDisabled,
  getItemText,
  selectedIndex,
  closeOnActivate = true,
}: UseListboxOptions): UseListboxResult {
  const [activeIndex, setActiveIndex] = useState(-1);
  const typeahead = useRef({ buffer: '', timer: 0 });

  const enabled = (i: number) => i >= 0 && i < itemCount && !isDisabled?.(i);
  const firstEnabled = (from: number, dir: number) => {
    for (let i = from; i >= 0 && i < itemCount; i += dir) if (enabled(i)) return i;
    return -1;
  };

  // Highlight the selected item (or the first enabled one) on open; clear on close.
  useEffect(() => {
    setActiveIndex(
      open
        ? selectedIndex != null && enabled(selectedIndex)
          ? selectedIndex
          : firstEnabled(0, 1)
        : -1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the active item visible inside a scrolling menu.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(getItemId(activeIndex))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  const move = (dir: number) =>
    setActiveIndex((prev) => {
      if (itemCount === 0) return -1;
      let i = prev < 0 ? (dir > 0 ? -1 : 0) : prev;
      for (let step = 0; step < itemCount; step += 1) {
        i = (i + dir + itemCount) % itemCount;
        if (enabled(i)) return i;
      }
      return prev;
    });

  const typeJump = (char: string): boolean => {
    if (!getItemText || itemCount === 0) return false;
    const t = typeahead.current;
    window.clearTimeout(t.timer);
    t.buffer += char.toLowerCase();
    t.timer = window.setTimeout(() => {
      t.buffer = '';
    }, 500);
    const start = activeIndex < 0 ? 0 : activeIndex;
    // single char → start at next item (cycle); multi-char → re-match from current
    for (let step = t.buffer.length === 1 ? 1 : 0; step <= itemCount; step += 1) {
      const i = (start + step) % itemCount;
      if (enabled(i) && getItemText(i).toLowerCase().startsWith(t.buffer)) {
        setOpen(true);
        setActiveIndex(i);
        return true;
      }
    }
    return false;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (open) move(1);
        else setOpen(true);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open) move(-1);
        else setOpen(true);
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setActiveIndex(firstEnabled(0, 1));
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          setActiveIndex(firstEnabled(itemCount - 1, -1));
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) setOpen(true);
        else if (activeIndex >= 0) {
          onActivate(activeIndex);
          if (closeOnActivate) setOpen(false);
        }
        break;
      default:
        if (e.key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey) {
          if (typeJump(e.key)) e.preventDefault();
        }
        break;
    }
  };

  return {
    activeIndex,
    setActiveIndex,
    onKeyDown,
    activeId: open && activeIndex >= 0 ? getItemId(activeIndex) : undefined,
  };
}
