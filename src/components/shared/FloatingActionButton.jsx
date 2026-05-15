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

  // Layout
  'flex h-14 w-14 items-center justify-center lg:h-12 lg:w-auto lg:px-4',

  // Shape
  'rounded-2xl',

  // Glass styling
  'border border-border/60',
  'bg-card/80 supports-[backdrop-filter]:bg-card/70',
  'backdrop-blur-xl',

  // Text/Icon
  'text-foreground',

  // Depth
  'shadow-[0_12px_32px_rgba(15,23,42,0.16)]',
  'dark:shadow-[0_12px_32px_rgba(0,0,0,0.35)]',

  // Motion
  'transition-all duration-200',
  'hover:-translate-y-0.5 hover:bg-card/90',
  'active:scale-[0.97]',

  // Desktop
  'lg:bottom-8 lg:right-8 lg:gap-2',

  className
);

  const content = (
  <>
    <Plus className="h-5 w-5 stroke-[2.4]" />
    <span className="hidden lg:inline text-sm font-semibold">
      Add
    </span>
  </>
);

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
