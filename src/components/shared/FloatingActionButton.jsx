import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function FloatingActionButton({
  to,
  onClick,
  ariaLabel = 'Add',
  className,
}) {
  const baseClassName = cn(
    // Position
    'fixed z-50',
    'bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-5',
    'lg:bottom-8 lg:right-8',

    // Shape / size
    'flex items-center justify-center',
    'h-14 w-14',
    'lg:h-12 lg:w-auto lg:px-5 lg:gap-2',
    'rounded-2xl lg:rounded-2xl',
    'relative overflow-hidden',

    // Visual
    'bg-primary text-primary-foreground',
    'shadow-[0_8px_32px_hsl(var(--primary)/0.45)]',
    'dark:shadow-[0_8px_32px_hsl(var(--primary)/0.35)]',

    // Interaction
    'transition-none',
    className
  );

  const content = (
    <>
      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-primary opacity-[0.18] animate-ping" />

      <Plus className="relative z-10 h-5 w-5 stroke-[2.4]" />

      <span className="relative z-10 hidden text-sm font-semibold lg:inline">
        Add
      </span>
    </>
  );

  const motionProps = {
    initial: { scale: 0, rotate: -90, opacity: 0 },
    animate: { scale: 1, rotate: 0, opacity: 1 },
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
      delay: 0.15,
    },
    whileHover: { scale: 1.06, y: -2 },
    whileTap: { scale: 0.94 },
  };

  if (to) {
    return (
      <motion.div {...motionProps}>
        <Link to={to} aria-label={ariaLabel} className={baseClassName}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={baseClassName}
      {...motionProps}
    >
      {content}
    </motion.button>
  );
}