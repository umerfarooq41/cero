import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { queryClientInstance } from '@/lib/query-client';
import { toast } from 'sonner';

export default function MonthSelector({
  currentMonth,
  onChange,
  subtitle = 'Budget period',
  onLabelClick,
  trailingAction,
  className,
  bare = false,
  disabled = false,
}) {
  const date = new Date(`${currentMonth}-01T12:00:00`);

  const changeMonth = (nextMonth) => {
    if (disabled) return;
    if (!navigator.onLine) {
      const cached = queryClientInstance
        .getQueryCache()
        .getAll()
        .some((query) => query.queryKey?.includes(nextMonth) && query.state?.data !== undefined);

      if (!cached) {
        toast.info('This period isn\'t available offline', {
          description: `Reconnect to load ${format(new Date(`${nextMonth}-01T12:00:00`), 'MMMM yyyy')}.`,
        });
        return;
      }
    }

    onChange?.(nextMonth);
  };

  const goToPreviousMonth = () => {
    changeMonth(format(subMonths(date, 1), 'yyyy-MM'));
  };

  const goToNextMonth = () => {
    changeMonth(format(addMonths(date, 1), 'yyyy-MM'));
  };

  return (
    <motion.div
      drag={disabled ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragEnd={(_, info) => {
        if (info.offset.x < -40) goToNextMonth();
        if (info.offset.x > 40) goToPreviousMonth();
      }}
      className={cn(
        bare
          ? 'flex w-full min-w-0 touch-pan-y select-none items-center justify-center gap-1 bg-transparent'
          : 'flex w-full max-w-md touch-pan-y select-none items-center justify-center gap-1 rounded-md bg-transparent',
        className
      )}
    >
      <button
        type="button"
        disabled={disabled} aria-label="Previous month" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-30" onPointerUp={(event) => { if (event.pointerType !== 'mouse') event.currentTarget.blur(); }}
        onClick={goToPreviousMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {onLabelClick ? (<motion.button
        type="button"
        disabled={!onLabelClick}
        onClick={onLabelClick}
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center justify-center min-h-9 rounded-md border border-border bg-background px-2 py-1 text-center transition-colors',
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
          className="text-sm font-medium text-foreground"
        >
          {format(date, 'MMMM yyyy')}
        </motion.span>

        {subtitle && (
          <span className="mt-0.5 text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </motion.button>) : (
        <Select value={currentMonth} onValueChange={changeMonth} disabled={disabled}>
          <SelectTrigger aria-label="Select month" className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-center text-sm font-medium [&>span]:flex [&>span]:flex-1 [&>span]:justify-center">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="center">
            {Array.from({length: 109}, (_, index) => format(addMonths(date, index - 54), 'yyyy-MM')).map(value => <SelectItem key={value} value={value} className="justify-center text-center">{format(new Date(value + '-01T12:00:00'), 'MMMM yyyy')}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      <button
        type="button"
        disabled={disabled} aria-label="Next month" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-30"
        onClick={goToNextMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {trailingAction && (
        <div className="ml-1 flex shrink-0 items-center gap-1">
          {trailingAction}
        </div>
      )}
    </motion.div>
  );
}
