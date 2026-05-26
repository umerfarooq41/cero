import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from 'recharts';

import { cn } from '@/lib/utils';
import PlanMoney from './PlanMoney';

function LegendItem({ item }) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-1.5 text-[10px] font-semibold leading-4 text-muted-foreground sm:text-[11px]">
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: item.color }}
        aria-hidden="true"
      />

      <span className="min-w-0 truncate">{item.name}</span>

      <span className="shrink-0 tabular-nums text-foreground/75">
        {Math.round(item.share || 0)}%
      </span>
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
  const hasTrackedData = chartData.some((item) => Number(item.tracked || 0) > 0);
  const legendItems = hasTrackedData ? donutChartData : [];

  return (
    <div className="rounded-3xl app-card-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Tracked</p>

          <h2
            className="mt-1 truncate text-base font-bold tracking-tight tabular-nums sm:text-lg"
            style={{
              color: tab.color || donutChartData?.[0]?.color || 'hsl(var(--foreground))',
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
              paddingAngle={hasTrackedData && donutChartData.length > 1 ? 3 : 0}
              stroke="none"
              isAnimationActive
            >
              {donutChartData.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={hasTrackedData ? entry.color : '#E5E7EB'}
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
            {Math.round(progress)}%
          </p>
        </div>
      </div>

      {legendItems.length > 0 ? (
        <div
          className="mt-2 grid w-full items-center gap-2"
          style={{ gridTemplateColumns: `repeat(${legendItems.length}, minmax(0, 1fr))` }}
        >
          {legendItems.map((item) => (
            <LegendItem key={item.id || item.name} item={item} />
          ))}
        </div>
      ) : (
        <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">
          No tracked {tab.title.toLowerCase()} yet
        </p>
      )}
    </div>
  );
}
