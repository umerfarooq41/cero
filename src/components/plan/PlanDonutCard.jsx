import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { cn } from '@/lib/utils';
import PlanMoney from './PlanMoney';

function DonutTooltip({ active, payload, currency, tab }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  const tracked = Number(item?.tracked || 0);
  const planned = Number(item?.planned || 0);
  const percent = planned > 0 ? Math.round((tracked / planned) * 100) : 0;

  return (
    <div className="rounded-xl border bg-popover px-3 py-2 shadow-lg">
      <p className="text-xs font-bold tabular-nums">{item?.name}</p>

      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{tab.label}</span>
        <PlanMoney amount={tracked} currency={currency} compact />
      </div>

      <p
        className="mt-1 text-[11px] font-semibold tabular-nums"
        style={{ color: item?.color }}
      >
        {percent}% tracked
      </p>
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
  return (
    <div className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Tracked</p>

          <h2 className="mt-1 truncate text-base font-bold tracking-tight text-foreground tabular-nums sm:text-lg"
style={{ color: tab.color }}
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
                  fill={chartData.length > 0 ? entry.color : '#E5E7EB'}
                  stroke="none"
                  tabIndex={-1}
                  focusable="false"
                  style={{ outline: 'none' }}
                />
              ))}
            </Pie>

            <Tooltip
              content={<DonutTooltip currency={currency} tab={tab} />}
              cursor={false}
              offset={12}
              wrapperStyle={{
                outline: 'none',
                zIndex: 30,
                pointerEvents: 'none',
              }}
              allowEscapeViewBox={{ x: false, y: false }}
            />
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
    </div>
  );
}