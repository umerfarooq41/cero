import { useEffect } from 'react';

/** Keep the entire sheet within the visible viewport when the keyboard opens. */
export function useAppSheetKeyboard() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;
    const update = () => {
      // Android can resize either viewport; don't also lift the sheet by the keyboard height.
      const visibleHeight = Math.min(window.innerHeight, viewport.height);
      document.documentElement.style.setProperty('--app-sheet-visible-height', visibleHeight + 'px');
      document.documentElement.style.setProperty('--app-sheet-viewport-top', viewport.offsetTop + 'px');
    };
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      document.documentElement.style.removeProperty('--app-sheet-visible-height');
      document.documentElement.style.removeProperty('--app-sheet-viewport-top');
    };
  }, []);
}

export function AppSheetKeyboard() {
  useAppSheetKeyboard();
  return null;
}
