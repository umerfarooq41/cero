import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const MotionLink = motion(Link);

export default function FloatingActionButton({
  to,
  onClick,
  ariaLabel = 'Add',
  label = 'Add',
  className,
}) {
  const [mounted, setMounted] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    setMounted(true);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const baseClassName = cn(
    // Forced viewport position
    '!fixed z-[9999]',
    '!left-auto !right-5',
    '!bottom-[calc(5.75rem+env(safe-area-inset-bottom))]',
    'lg:!right-8 lg:!bottom-8',

    // Size / shape
    'flex items-center justify-center',
    'h-14 w-14',
    'lg:h-12 lg:w-auto lg:px-5 lg:gap-2',
    'rounded-2xl',
    'relative overflow-hidden',

    // Visual
    'bg-primary text-primary-foreground',
    'shadow-[0_8px_32px_hsl(var(--primary)/0.45)]',
    'dark:shadow-[0_8px_32px_hsl(var(--primary)/0.35)]',

    'transition-none',
    className
  );

  const content = (
    <>
      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-primary opacity-[0.18] animate-ping" />

      <Plus className="relative z-10 h-5 w-5 stroke-[2.4]" />

      <span className="relative z-10 hidden text-sm font-semibold lg:inline">
        {label}
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

  if (!mounted) return null;

  const showOfflineMessage = () => {
    toast.info('Unavailable offline', {
      description: 'Reconnect to add or change data.',
    });
  };

  const fab = to && online ? (
    <MotionLink
      to={to}
      aria-label={ariaLabel}
      className={baseClassName}
      {...motionProps}
    >
      {content}
    </MotionLink>
  ) : (
    <motion.button
      type="button"
      onClick={online ? onClick : showOfflineMessage}
      aria-label={online ? ariaLabel : `${ariaLabel} unavailable offline`}
      className={cn(baseClassName, !online && 'opacity-55 shadow-none')}
      {...motionProps}
    >
      {content}
    </motion.button>
  );

  return createPortal(fab, document.body);
}