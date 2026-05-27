import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

function getScrollTargets() {
  return [
    document.querySelector('.app-main-scroll'),
    window,
    document.documentElement,
    document.body,
  ].filter(Boolean);
}

function setTargetTop(target) {
  if (!target) return;

  if (target === window) {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return;
  }

  if (target.style) {
    target.style.scrollBehavior = 'auto';
  }

  if (typeof target.scrollTo === 'function') {
    target.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  target.scrollTop = 0;
  target.scrollLeft = 0;
}

function scrollToTop() {
  const run = () => {
    getScrollTargets().forEach(setTargetTop);
  };

  run();
  requestAnimationFrame(run);
  requestAnimationFrame(() => {
    run();
    window.setTimeout(run, 0);
    window.setTimeout(run, 80);
    window.setTimeout(run, 180);
  });
}

export default function ScrollManager() {
  const location = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    if (location.hash) return;

    scrollToTop();
  }, [location.key, location.pathname, location.search, location.hash]);

  return null;
}
