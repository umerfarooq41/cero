import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

const MotionLink = motion(Link);

const fabMotion = {
  initial: {
    opacity: 0,
    scale: 0.65,
    y: 18,
    rotate: -14,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotate: 0,
    filter: 'blur(0px)',
  },
  transition: {
    type: 'spring',
    stiffness: 420,
    damping: 24,
    mass: 0.8,
    delay: 0.12,
  },
  whileHover: {
    scale: 1.06,
    y: -3,
    transition: { type: 'spring', stiffness: 420, damping: 18 },
  },
  whileTap: {
    scale: 0.94,
    y: 0,
  },
};

export default function FloatingActionButton({
  to,
  onClick,
  ariaLabel = 'Add',
  label = 'Add',
  className,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const baseClassName = cn(
    '!fixed z-[9999]',
    '!left-auto !right-5',
    '!bottom-[calc(5.75rem+env(safe-area-inset-bottom))]',
    'lg:!right-8 lg:!bottom-8',
    'group flex items-center justify-center',
    'h-14 w-14 lg:h-12 lg:w-auto lg:gap-2 lg:px-5',
    'relative overflow-hidden rounded-2xl',
    'bg-primary text-primary-foreground',
    'shadow-[0_8px_32px_hsl(var(--primary)/0.45)]',
    'dark:shadow-[0_8px_32px_hsl(var(--primary)/0.35)]',
    'outline-none ring-1 ring-primary-foreground/15',
    'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'transition-none',
    className
  );

  const content = (
    <>
      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-primary opacity-[0.18] animate-ping" />
      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/24 via-white/8 to-transparent" />

      <Plus className="relative z-10 h-5 w-5 stroke-[2.4] transition-transform duration-300 group-hover:rotate-90" />

      <span className="relative z-10 hidden text-sm font-semibold lg:inline">
        {label}
      </span>
    </>
  );

  const fab = to ? (
    <MotionLink
      key={`fab-link-${to}`}
      to={to}
      aria-label={ariaLabel}
      className={baseClassName}
      {...fabMotion}
    >
      {content}
    </MotionLink>
  ) : (
    <motion.button
      key={`fab-button-${ariaLabel}`}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={baseClassName}
      {...fabMotion}
    >
      {content}
    </motion.button>
  );

  return createPortal(fab, document.body);
}
