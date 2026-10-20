import { useEffect } from 'react';

/**
 * Keyboard offset for bottom sheets on Android Chrome.
 * Only compensates when the layout viewport remains taller than the visual viewport.
 */
export function useAppSheetKeyboard() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;
    const update = () => {
      const covered = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      const keyboard = covered > 100 ? covered : 0;
      document.documentElement.style.setProperty('--app-sheet-keyboard-offset', keyboard + 'px');
    };
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    update();
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      document.documentElement.style.setProperty('--app-sheet-keyboard-offset', '0px');
    };
  }, []);
}
