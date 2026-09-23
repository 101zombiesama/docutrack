import type { ThemePreference } from './types';
import { STORAGE_KEY } from './storage';

/**
 * Applies the resolved theme to <html>. Kept outside React so the inline
 * boot script in the root layout can run the same logic before first paint.
 */
export function applyTheme(preference: ThemePreference): void {
  if (typeof document === 'undefined') return;
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const resolved = preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;
  document.documentElement.dataset.theme = resolved;
}

/** Runs before hydration to prevent a flash of the wrong theme. */
export const THEME_BOOT_SCRIPT = `(function(){try{
var raw = localStorage.getItem('${STORAGE_KEY}');
var pref = raw ? (JSON.parse(raw).settings||{}).theme : 'system';
var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = (!pref||pref==='system') ? (dark?'dark':'light') : pref;
}catch(e){document.documentElement.dataset.theme='light';}})();`;
