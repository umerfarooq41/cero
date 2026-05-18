import { useEffect, useRef, useState } from 'react';

export function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const to = Number(target) || 0;

    cancelAnimationFrame(frameRef.current);
    startRef.current = null;
    setValue(0);

    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;

      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(to * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setValue(to);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}