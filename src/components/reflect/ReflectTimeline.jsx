import { useEffect, useMemo, useRef } from 'react';
import { CalendarRange, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import ReflectCard from './ReflectCard.jsx';
import { CurrencyAmount } from './ReflectSummaryCard.jsx';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function getCurrentQuarter() {
  return Math.floor(new Date().getMonth() / 3) + 1;
}

function TimelineAmount({ label, amount, currency, tone }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-semibold tabular-nums', tone)}>
        <CurrencyAmount amount={amount} currency={currency} compact />
      </span>
    </div>
  );
}

export default function ReflectTimeline({
  isYear,
  selectedYear,
  selectedMonth,
  timelineItems = [],
  currency,
  onMonthChange,
  onPeriodModeChange,
}) {
  const scrollerRef = useRef(null);
  const itemRefs = useRef({});

  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const currentQuarter = getCurrentQuarter();

  const activeKey = useMemo(() => {
    if (isYear) {
      return Number(selectedYear) === currentYear ? `Q${currentQuarter}` : 'Q1';
    }

    return `${selectedYear}-${selectedMonth}`;
  }, [isYear, selectedYear, selectedMonth, currentYear, currentQuarter]);

  useEffect(() => {
    const activeEl = itemRefs.current[activeKey];
    const scroller = scrollerRef.current;

    if (!activeEl || !scroller) return;

    activeEl.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeKey, timelineItems.length]);

  const title = isYear ? `Year Timeline — ${selectedYear}` : `Monthly Timeline — ${selectedYear}`;
  const subtitle = isYear
    ? 'Quarterly cash-flow rhythm. Tap a quarter to inspect its first month.'
    : 'Tap a month to move the whole Reflect view.';

  const handleItemClick = (item) => {
    if (isYear) {
      onPeriodModeChange?.('month');
      onMonthChange?.(item.firstMonth || '01');
      return;
    }

    onMonthChange?.(item.monthValue);
  };

  return (
    <ReflectCard className="mb-4 overflow-hidden rounded-3xl border border-border/60 bg-card/65 p-0 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            <span>{title}</span>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>

        <div className="hidden shrink-0 items-center gap-1 rounded-full bg-muted/50 px-2.5 py-1 text-xs font-semibold text-muted-foreground sm:flex">
          <span>{isYear ? 'Quarters' : MONTH_LABELS[Number(selectedMonth || currentMonth) - 1]}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden"
      >
        {timelineItems.map((item, index) => {
          const key = item.key || `${selectedYear}-${item.monthValue || index}`;
          const isActive = isYear
            ? key === activeKey
            : item.monthValue === selectedMonth;
          const isCurrent = isYear
            ? Number(selectedYear) === currentYear && item.quarterIndex === currentQuarter
            : Number(selectedYear) === currentYear && item.monthValue === currentMonth;
          const positive = Number(item.net || 0) >= 0;

          return (
            <motion.button
              key={key}
              ref={(node) => {
                if (node) itemRefs.current[key] = node;
              }}
              type="button"
              onClick={() => handleItemClick(item)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.035, 0.25) }}
              className={cn(
                'group min-w-[168px] snap-center rounded-2xl border p-3 text-left transition-all duration-300',
                'focus:outline-none focus:ring-2 focus:ring-ring/40',
                isActive
                  ? 'border-primary/40 bg-primary/8 shadow-md shadow-primary/10'
                  : 'border-border/60 bg-background/35 hover:border-primary/25 hover:bg-background/55'
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold tracking-tight text-foreground">
                    {item.label}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {item.subLabel}
                  </div>
                </div>

                {(isActive || isCurrent) && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      isActive
                        ? 'bg-primary/12 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isActive ? 'Active' : 'Now'}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <TimelineAmount
                  label="Income"
                  amount={item.income}
                  currency={currency}
                  tone="text-emerald-600 dark:text-emerald-400"
                />
                <TimelineAmount
                  label="Expenses"
                  amount={item.expenses}
                  currency={currency}
                  tone="text-red-600 dark:text-red-400"
                />
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2">
                <span className="text-[11px] text-muted-foreground">Net</span>
                <span
                  className={cn(
                    'text-xs font-bold tabular-nums',
                    positive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  <CurrencyAmount amount={item.net} currency={currency} compact />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </ReflectCard>
  );
}
