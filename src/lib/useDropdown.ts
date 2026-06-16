import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Open/close state for an in-flow dropdown/popover: closes on outside
 * pointer-down and on Escape. Attach `rootRef` to the element that wraps both
 * the trigger and the floating panel (so clicks inside either don't close it).
 */
export function useDropdown<T extends HTMLElement = HTMLDivElement>(): {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  rootRef: RefObject<T | null>;
} {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return { open, setOpen, toggle: () => setOpen((o) => !o), rootRef };
}
