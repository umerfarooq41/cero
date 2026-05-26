import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from 'recharts';

import { cn } from '@/lib/utils';
import PlanMoney from './PlanMoney';

function LegendItem({ item, compact }) {
  return (
    <div
      className={cn(
        'inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full border border-border/70 bg-background/85 px-2.5 py-1 text-[10px] font-semibold leading-none text-muted-foreground shadow-sm sm:text-[11px]',
        compact ? 'flex-1 px-2' : 'shrink-0'
      )}
      title={item.name}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: item.color }}
        aria-hidden="true"
      />
      <span className="min-w-0 truncate">{item.name}</span>
    </div>
  );
}

export default function PlanDonutCard({
  tab,
  chartData,
  donutChartData,
  totalTracked,
  totalPlanned,
  totalRemaining,
  progress,
  currency,
}) {
  const trackedLegendItems = donutChartData.filter(
    (item) => !item.isRemainder && !item.isEmpty && Number(item.tracked || 0) > 0
  );
  const hasTrackedData = trackedLegendItems.length > 0;
  const displayProgress = Math.round(progress);
  const compactLegend = trackedLegendItems.length >= 4;
  const primarySliceColor =
    donutChartData?.find((item) => !item.isRemainder && !item.isEmpty)?.color ||
    tab.color ||
    'hsl(var(--foreground))';

  return (
    <div className="rounded-3xl app-card-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Tracked</p>

          <h2
            className="mt-1 truncate text-base font-bold tracking-tight tabular-nums sm:text-lg"
            style={{ color: primarySliceColor }}
          >
            <PlanMoney amount={totalTracked} currency={currency} />
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            {tab.label} of{' '}
            <PlanMoney amount={totalPlanned} currency={currency} compact />
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-medium text-muted-foreground">
            {totalRemaining >= 0 ? 'Left' : 'Over'}
          </p>

          <p
            className={cn(
              'mt-1 text-base font-bold tracking-tight tabular-nums sm:text-lg',
              totalRemaining < 0 ? 'text-red-600' : 'text-foreground'
            )}
          >
            <PlanMoney
              amount={Math.abs(totalRemaining)}
              currency={currency}
              compact
            />
          </p>
        </div>
      </div>

      <div className="relative mx-auto mt-4 flex h-52 w-full max-w-[280px] items-center justify-center [&_.recharts-wrapper]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={donutChartData}
              dataKey="value"
              nameKey="name"
              innerRadius={66}
              outerRadius={92}
              paddingAngle={donutChartData.length > 1 ? 3 : 0}
              stroke="none"
              isAnimationActive
            >
              {donutChartData.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={entry.color}
                  stroke="none"
                  tabIndex={-1}
                  focusable="false"
                  style={{ outline: 'none' }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {tab.label}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
            {displayProgress}%
          </p>
        </div>
      </div>

      {hasTrackedData ? (
        <div className="mt-2 flex w-full items-center justify-center gap-1.5 overflow-hidden">
          {trackedLegendItems.map((item) => (
            <LegendItem
              key={item.id || item.name}
              item={item}
              compact={compactLegend}
            />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
          No tracked {tab.title.toLowerCase()} yet
        </p>
      )}
    </div>
  );
}
