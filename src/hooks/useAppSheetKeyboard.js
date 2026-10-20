import { useEffect } from 'react';

/**
 * Keep AppSheet at its natural height when the keyboard appears.
 * Only scroll the form body if the focused field is actually obscured.
 */
export function useAppSheetKeyboard() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;

    let frame = 0;
    const revealFocusedField = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const focused = document.activeElement;
        if (!focused?.matches?.('.app-sheet-surface input, .app-sheet-surface textarea, .app-sheet-surface select')) return;

        const sheet = focused.closest('.app-sheet-surface');
        const body = focused.closest('.app-dialog-scroll, .app-route-sheet-body');
        if (!sheet || !body) return;

        const field = focused.getBoundingClientRect();
        const bodyRect = body.getBoundingClientRect();
        const visibleBottom = Math.min(
          viewport.offsetTop + viewport.height,
          bodyRect.bottom
        ) - 12;
        const visibleTop = Math.max(viewport.offsetTop, bodyRect.top) + 12;

        if (field.bottom > visibleBottom) {
          body.scrollBy({ top: field.bottom - visibleBottom, behavior: 'smooth' });
        } else if (field.top < visibleTop) {
          body.scrollBy({ top: field.top - visibleTop, behavior: 'smooth' });
        }
      });
    };

    viewport.addEventListener('resize', revealFocusedField);
    viewport.addEventListener('scroll', revealFocusedField);
    document.addEventListener('focusin', revealFocusedField);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', revealFocusedField);
      viewport.removeEventListener('scroll', revealFocusedField);
      document.removeEventListener('focusin', revealFocusedField);
    };
  }, []);
}

export function AppSheetKeyboard() {
  useAppSheetKeyboard();
  return null;
}
