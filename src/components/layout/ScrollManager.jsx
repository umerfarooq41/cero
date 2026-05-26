import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const MAIN_NAV_ROUTES = ['/', '/plan', '/transactions', '/accounts', '/manage-plan'];

function isMainRoute(pathname) {
  return MAIN_NAV_ROUTES.includes(pathname);
}

function getScrollElement() {
  return document.querySelector('.app-main-scroll') || window;
}

function scrollToTop() {
  const scrollElement = getScrollElement();

  if (scrollElement === window) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return;
  }

  scrollElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

export default function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousPathRef = useRef(location.pathname);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    const currentPath = location.pathname;

    previousPathRef.current = currentPath;

    const isSamePage = previousPath === currentPath;
    const isBackOrForward = navigationType === 'POP';

    if (isSamePage) return;

    // Preserve natural browser back/forward position.
    if (isBackOrForward) return;

    // Main bottom-nav pages open from the top.
    if (isMainRoute(currentPath)) {
      requestAnimationFrame(() => {
        scrollToTop();
      });
    }
  }, [location.pathname, navigationType]);

  return null;
}