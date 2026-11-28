import { useSyncExternalStore } from 'react';
export const TABLET_MIN = 768;
export const DESKTOP_MIN = 1200;
export function getResponsiveLayout(width) {
  return width >= DESKTOP_MIN ? 'desktop' : width >= TABLET_MIN ? 'tablet' : 'mobile';
}
function subscribe(callback) {
  const queries = [TABLET_MIN, DESKTOP_MIN].map(width => window.matchMedia(`(min-width: ${width}px)`));
  queries.forEach(query => query.addEventListener('change', callback));
  return () => queries.forEach(query => query.removeEventListener('change', callback));
}
function snapshot() {
  return getResponsiveLayout(window.innerWidth);
}
export function useResponsiveLayout() {
  return useSyncExternalStore(subscribe, snapshot, () => 'mobile');
}
