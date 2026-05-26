import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from 'recharts';

import { cn } from '@/lib/utils';
import PlanMoney from './PlanMoney';

function getLegendPercent(item, totalTracked) {
  if (!totalTracked) return 0;

  return Math.round((Number(item.tracked || 0) / totalTracked) * 100);
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

  return (
    <div className="rounded-3xl app-card-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Tracked</p>

          <h2
            className="mt-1 truncate text-base font-bold tracking-tight tabular-nums sm:text-lg"
            style={{
              color:
                tab.color || donutChartData?.find((item) => !item.isRemainder)?.color ||
                'hsl(var(--foreground))',
            }}
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
        <div className="mt-2 flex w-full items-center gap-3 overflow-x-auto whitespace-nowrap pb-0.5 text-[11px] font-semibold text-muted-foreground">
          {trackedLegendItems.map((item) => (
            <div key={item.id || item.name} className="inline-flex min-w-0 shrink-0 items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="max-w-[5.5rem] truncate">{item.name}</span>
              <span className="text-foreground/70 tabular-nums">
                {getLegendPercent(item, totalTracked)}%
              </span>
            </div>
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
