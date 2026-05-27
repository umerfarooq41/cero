import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

function getScrollTargets() {
  const targets = [document.querySelector('.app-main-scroll')].filter(Boolean);

  return [
    ...targets,
    window,
    document.documentElement,
    document.body,
  ];
}

function setTargetTop(target) {
  if (!target) return;

  if (target === window) {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return;
  }

  if (typeof target.scrollTo === 'function') {
    target.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  target.scrollTop = 0;
  target.scrollLeft = 0;
}

function scrollToTop() {
  const targets = getScrollTargets();
  const previousScrollBehaviors = targets.map((target) => {
    if (target === window || !target?.style) return null;

    const previous = target.style.scrollBehavior;
    target.style.scrollBehavior = 'auto';
    return previous;
  });

  const run = () => {
    targets.forEach(setTargetTop);
  };

  run();
  requestAnimationFrame(run);
  requestAnimationFrame(() => {
    run();

    window.setTimeout(run, 0);
    window.setTimeout(() => {
      run();

      targets.forEach((target, index) => {
        if (target === window || !target?.style) return;
        target.style.scrollBehavior = previousScrollBehaviors[index] || '';
      });
    }, 80);
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
  }, [location.pathname, location.search, location.hash]);

  return null;
}
