import { useEffect } from 'react';
import { useAnimate, stagger } from 'framer-motion';

export function usePageEntrance(
  selector = '.animate-child:not(header):not(.page-header):not([data-no-page-entrance])'
) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    animate(
      selector,
      { opacity: [0, 1], y: [10, 0] },
      { duration: 0.22, delay: stagger(0.035), ease: [0.22, 1, 0.36, 1] }
    );
  }, [animate, selector]);

  return scope;
}