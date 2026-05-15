import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FloatingActionButton({
  to,
  onClick,
  ariaLabel = 'Add',
  className,
}) {
  const classes = cn(
    'fixed bottom-24 right-5 z-50',
    'flex h-14 w-14 items-center justify-center',
    'rounded-2xl p-0',
    'surface-card card-elevated',
    'border border-white/40 dark:border-white/[0.06]',
    'backdrop-blur-xl text-primary',
    'transition-all duration-200',
    'hover:scale-[1.03] active:scale-[0.98]',
    'lg:bottom-8 lg:right-8',
    className
  );

  const content = <Plus className="h-6 w-6 stroke-[2.4]" />;

  if (to) {
    return (
      <Link to={to} aria-label={ariaLabel} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={classes}>
      {content}
    </button>
  );
}
