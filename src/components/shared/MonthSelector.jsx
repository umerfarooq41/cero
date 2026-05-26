import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function MonthSelector({
  currentMonth,
  onChange,
  subtitle = 'Budget period',
  onLabelClick,
  trailingAction,
  className,
}) {
  const date = new Date(`${currentMonth}-01`);

  const goToPreviousMonth = () => {
    onChange?.(format(subMonths(date, 1), 'yyyy-MM'));
  };

  const goToNextMonth = () => {
    onChange?.(format(addMonths(date, 1), 'yyyy-MM'));
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragEnd={(_, info) => {
        if (info.offset.x < -40) goToNextMonth();
        if (info.offset.x > 40) goToPreviousMonth();
      }}
      className={cn(
        'flex w-full max-w-md touch-pan-y select-none items-center justify-center gap-1.5 rounded-2xl border border-border/60 app-card-surface p-1.5 shadow-sm backdrop-blur-xl',
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-xl"
        onClick={goToPreviousMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <motion.button
        type="button"
        disabled={!onLabelClick}
        onClick={onLabelClick}
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-3 py-1.5 text-center transition-colors',
          onLabelClick
            ? 'hover:bg-secondary/70'
            : 'cursor-default disabled:opacity-100'
        )}
      >
        <motion.span
          key={currentMonth}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="text-sm font-semibold text-foreground"
        >
          {format(date, 'MMMM yyyy')}
        </motion.span>

        {subtitle && (
          <span className="mt-0.5 text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </motion.button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-xl"
        onClick={goToNextMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {trailingAction && (
        <div className="ml-1 flex shrink-0 items-center gap-1">
          {trailingAction}
        </div>
      )}
    </motion.div>
  );
}
