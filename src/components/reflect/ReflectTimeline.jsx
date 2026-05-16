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

function getItemKey(item, index) {
  return String(
    item.key ??
      `${item.year ?? 'period'}-${item.monthValue ?? item.label ?? index}`
  );
}

function generateSparkline(values = []) {
  if (!values.length) return '';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 120;
      const normalized = (value - min) / range;
      const y = 20 - normalized * 16;

      return `${x},${y}`;
    })
    .join(' ');
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
  const currentQuarterLabel = `Q${currentQuarter}`;

  const activeItemKey = useMemo(() => {
    if (!timelineItems.length) return null;

    if (isYear) {
      const targetQuarter =
        Number(selectedYear) === currentYear ? currentQuarterLabel : 'Q1';

      const activeQuarterItem = timelineItems.find((item, index) => {
        const key = getItemKey(item, index);
        const label = String(item.label ?? '');
        const quarter = String(item.quarter ?? '');

        return (
          key === targetQuarter ||
          key === `${selectedYear}-${targetQuarter}` ||
          label === targetQuarter ||
          quarter === targetQuarter
        );
      });

      return activeQuarterItem
        ? getItemKey(activeQuarterItem, timelineItems.indexOf(activeQuarterItem))
        : getItemKey(timelineItems[0], 0);
    }

    const activeMonthItem = timelineItems.find((item, index) => {
      const key = getItemKey(item, index);

      return (
        key === `${selectedYear}-${selectedMonth}` ||
        (Number(item.year) === Number(selectedYear) &&
          item.monthValue === selectedMonth)
      );
    });

    return activeMonthItem
      ? getItemKey(activeMonthItem, timelineItems.indexOf(activeMonthItem))
      : null;
  }, [
    isYear,
    selectedYear,
    selectedMonth,
    currentYear,
    currentQuarterLabel,
    timelineItems,
  ]);

  useEffect(() => {
    if (!activeItemKey) return;

    const activeElement = itemRefs.current[activeItemKey];
    const scroller = scrollerRef.current;

    if (!activeElement || !scroller) return;

    activeElement.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeItemKey, timelineItems.length]);

  const title = isYear
    ? `Year Timeline — ${selectedYear}`
    : `Monthly Timeline — ${selectedYear}`;

  const subtitle = isYear
    ? 'Quarterly cash-flow rhythm. Tap a quarter to inspect its first month.'
    : 'Tap any month to move the whole Reflect view.';

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
          <span>
            {isYear
              ? 'Quarters'
              : MONTH_LABELS[Number(selectedMonth || currentMonth) - 1]}
          </span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden"
      >
        {timelineItems.map((item, index) => {
          const key = getItemKey(item, index);
          const isActive = key === activeItemKey;

          const isNow = isYear
            ? Number(selectedYear) === currentYear &&
              (key === currentQuarterLabel ||
                key === `${selectedYear}-${currentQuarterLabel}` ||
                item.label === currentQuarterLabel ||
                item.quarter === currentQuarterLabel)
            : Number(item.year) === currentYear &&
              item.monthValue === currentMonth;

          const positive = Number(item.net || 0) >= 0;
          const sparklinePoints = generateSparkline(item.sparkline || []);

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
              transition={{
                duration: 0.35,
                delay: Math.min(index * 0.035, 0.25),
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn(
                'group min-w-[168px] snap-center rounded-2xl border p-3 text-left transition-all duration-300',
                'focus:outline-none focus:ring-2 focus:ring-ring/40',
                isActive
                  ? 'border-primary/40 bg-primary/[0.08] shadow-md shadow-primary/10'
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

                {(isActive || isNow) && (
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

              <svg
                width="100%"
                height="24"
                viewBox="0 0 120 24"
                className="overflow-visible"
              >
                {sparklinePoints ? (
                  <polyline
                    fill="none"
                    stroke={
                      positive
                        ? 'hsl(var(--success))'
                        : 'hsl(var(--destructive))'
                    }
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={sparklinePoints}
                  />
                ) : (
                  <line
                    x1="0"
                    y1="12"
                    x2="120"
                    y2="12"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.35"
                  />
                )}
              </svg>

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
                  <CurrencyAmount
                    amount={item.net}
                    currency={currency}
                    compact
                  />
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    positive ? 'bg-emerald-500' : 'bg-red-500'
                  )}
                />

                <span>{positive ? 'Positive' : 'Negative'}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </ReflectCard>
  );
}