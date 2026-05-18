import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function FloatingActionButton({ to, onClick, ariaLabel = 'Add', className }) {
  const inner = (
    <>
      {/* Pulse ring — subtle, runs once on mount */}
      <span className="absolute inset-0 rounded-2xl animate-ping opacity-[0.18] bg-primary pointer-events-none" />
      <Plus className="h-5 w-5 stroke-[2.4] relative z-10" />
      <span className="hidden lg:inline text-sm font-semibold relative z-10">Add</span>
    </>
  );

  const motionProps = {
    initial: { scale: 0, rotate: -90, opacity: 0 },
    animate: { scale: 1, rotate: 0, opacity: 1 },
    transition: { type: 'spring', stiffness: 300, damping: 20, delay: 0.15 },
    whileHover: { scale: 1.06, y: -2 },
    whileTap: { scale: 0.94 },
    className: cn(
      'fixed bottom-24 right-5 z-50 lg:bottom-8 lg:right-8',
      'flex h-14 w-14 items-center justify-center lg:h-12 lg:w-auto lg:px-5 lg:gap-2',
      'rounded-2xl relative overflow-hidden',
      'bg-primary text-primary-foreground',
      'shadow-[0_8px_32px_hsl(var(--primary)/0.45)]',
      'dark:shadow-[0_8px_32px_hsl(var(--primary)/0.35)]',
      className
    ),
  };

  if (to) {
    return (
      <motion.div {...motionProps}>
        <Link to={to} aria-label={ariaLabel} className="contents">{inner}</Link>
      </motion.div>
    );
  }

  return (
    <motion.button type="button" onClick={onClick} aria-label={ariaLabel} {...motionProps}>
      {inner}
    </motion.button>
  );
}
