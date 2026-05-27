import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const MAIN_NAV_ROUTES = ['/', '/plan', '/transactions', '/accounts', '/manage-plan'];

function isMainRoute(pathname) {
  return MAIN_NAV_ROUTES.includes(pathname);
}

function getScrollElement() {
  return document.querySelector('.app-main-scroll') || window;
}

function setScrollTop(scrollElement) {
  if (scrollElement === window) {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    return;
  }

  scrollElement.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  scrollElement.scrollTop = 0;
  scrollElement.scrollLeft = 0;
}

function scrollToTop() {
  const scrollElement = getScrollElement();
  const previousScrollBehavior = scrollElement === window ? null : scrollElement.style.scrollBehavior;

  if (scrollElement !== window) {
    scrollElement.style.scrollBehavior = 'auto';
  }

  setScrollTop(scrollElement);

  requestAnimationFrame(() => {
    setScrollTop(scrollElement);

    requestAnimationFrame(() => {
      setScrollTop(scrollElement);

      if (scrollElement !== window) {
        scrollElement.style.scrollBehavior = previousScrollBehavior || '';
      }
    });
  });
}

export default function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousPathRef = useRef(location.pathname);

  useLayoutEffect(() => {
    const previousPath = previousPathRef.current;
    const currentPath = location.pathname;

    previousPathRef.current = currentPath;

    const isSamePage = previousPath === currentPath;
    const isBackOrForward = navigationType === 'POP';

    if (isSamePage) return;

    // Preserve natural browser back/forward position.
    if (isBackOrForward) return;

    // Bottom-nav/main pages should always begin at the top of the app scroll area.
    if (isMainRoute(currentPath)) {
      scrollToTop();
    }
  }, [location.pathname, navigationType]);

  return null;
}
