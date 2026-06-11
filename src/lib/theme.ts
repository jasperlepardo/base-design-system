import { useCallback, useEffect, useState } from 'react';

/**
 * Theme control for the Base Design System.
 *
 * Theming is driven by the `data-theme` attribute on <html>:
 *   - `data-theme="light"` / `"dark"` — explicit, always wins
 *   - no attribute — follows the OS via `@media (prefers-color-scheme: dark)`
 *
 * So "system" mode simply removes the attribute. The chosen mode is persisted
 * to localStorage. Pair with `themeScript` in <head> to avoid a flash on load.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'jspr-theme';

/** Read the persisted mode (defaults to `system`). SSR-safe. */
export function getThemeMode(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'system';
  const v = localStorage.getItem(THEME_STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

/** Apply a mode to <html> and persist it. `system` clears the attribute. */
export function setThemeMode(mode: ThemeMode): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (mode === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Apply the persisted mode. Call once on app startup (after hydration). */
export function initTheme(): void {
  setThemeMode(getThemeMode());
}

/** Resolve what's actually showing right now (`system` → light|dark). */
export function resolveTheme(mode: ThemeMode = getThemeMode()): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  if (typeof matchMedia === 'undefined') return 'light';
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Inline this in <head> BEFORE your stylesheet to prevent a flash of the wrong
 * theme on load (it applies the saved attribute before first paint):
 *
 *   <script>{themeScript}</script>
 */
export const themeScript = `(function(){try{var m=localStorage.getItem('${THEME_STORAGE_KEY}');if(m==='light'||m==='dark')document.documentElement.setAttribute('data-theme',m);}catch(e){}})();`;

/** React hook: `[mode, setMode, resolved]`. Tracks OS changes while in `system`. */
export function useTheme(): [ThemeMode, (m: ThemeMode) => void, 'light' | 'dark'] {
  const [mode, setMode] = useState<ThemeMode>(getThemeMode);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolveTheme(mode));

  const update = useCallback((m: ThemeMode) => {
    setThemeMode(m);
    setMode(m);
    setResolved(resolveTheme(m));
  }, []);

  useEffect(() => {
    if (mode !== 'system' || typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolved(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  return [mode, update, resolved];
}
