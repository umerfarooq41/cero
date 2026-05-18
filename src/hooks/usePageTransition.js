import { useEffect } from 'react';
import { useAnimate, stagger } from 'framer-motion';

export function usePageEntrance(
  selector = '.animate-child:not(header):not(.page-header):not([data-no-page-entrance])'
) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    animate(
      selector,
      { opacity: [0, 1], y: [16, 0], filter: ['blur(4px)', 'blur(0px)'] },
      { duration: 0.4, delay: stagger(0.06), ease: [0.25, 0.46, 0.45, 0.94] }
    );
  }, [animate, selector]);

  return scope;
}
