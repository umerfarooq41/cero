import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const MotionLink = motion(Link);

export default function FloatingActionButton({
  to,
  onClick,
  ariaLabel = 'Add',
  className,
}) {
  const classes = cn(
    // Position
    'fixed bottom-24 right-5 z-50 lg:bottom-8 lg:right-8',

    // Layout
    'relative flex h-14 w-14 items-center justify-center',
    'lg:h-12 lg:w-auto lg:gap-2 lg:px-5',

    // Shape
    'rounded-2xl',

    // Solid primary styling
    'bg-primary text-primary-foreground',

    // Depth
    'shadow-[0_8px_32px_hsl(var(--primary)/0.4)]',

    // Interaction
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',

    className
  );

  const motionProps = {
    initial: { scale: 0, rotate: -90 },
    animate: { scale: 1, rotate: 0 },
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      delay: 0.2,
    },
    whileHover: { scale: 1.06, y: -2 },
    whileTap: { scale: 0.94 },
  };

  const content = (
    <>
      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-primary opacity-20 animate-ping" />

      <Plus className="relative z-10 h-5 w-5 stroke-[2.4]" />

      <span className="relative z-10 hidden text-sm font-semibold lg:inline">
        Add
      </span>
    </>
  );

  if (to) {
    return (
      <MotionLink
        to={to}
        aria-label={ariaLabel}
        className={classes}
        {...motionProps}
      >
        {content}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={classes}
      {...motionProps}
    >
      {content}
    </motion.button>
  );
}