import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { cn } from '@/lib/utils';
import PlanMoney from './PlanMoney';

function getTooltipActionLabel(tab, item) {
  if (item?.isRemainder) return 'Left';
  if (tab?.key === 'income') return 'Received';
  if (tab?.key === 'expense') return 'Spent';
  if (tab?.key === 'savings') return 'Saved';
  if (tab?.key === 'debt') return 'Paid';

  return tab?.label || 'Tracked';
}

function DonutTooltip({ active, payload, currency, tab, totalTracked, totalPlanned }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  const value = Number(item?.value || 0);
  const tracked = Number(item?.tracked || 0);
  const trackedShare = totalTracked > 0 ? Math.round((tracked / totalTracked) * 100) : 0;
  const plannedShare = totalPlanned > 0 ? Math.round((value / totalPlanned) * 100) : 0;
  const actionLabel = getTooltipActionLabel(tab, item);

  if (item?.isRemainder) {
    return (
      <div className="rounded-xl app-chart-tooltip-surface px-3 py-2 shadow-lg ring-1 ring-border/60">
        <p className="text-xs font-bold text-popover-foreground tabular-nums">
          Untracked
        </p>

        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{actionLabel}</span>
          <PlanMoney
            amount={value}
            currency={currency}
            compact
            className="font-semibold text-popover-foreground"
          />
        </div>

        <p className="mt-1 text-[11px] font-semibold text-muted-foreground tabular-nums">
          {plannedShare}% of planned
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl app-chart-tooltip-surface px-3 py-2 shadow-lg ring-1 ring-border/60">
      <p className="max-w-[160px] truncate text-xs font-bold text-popover-foreground tabular-nums">
        {item?.name}
      </p>

      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{actionLabel}</span>
        <PlanMoney
          amount={tracked}
          currency={currency}
          compact
          className="font-semibold text-popover-foreground"
        />
      </div>

      <p
        className="mt-1 text-[11px] font-semibold tabular-nums"
        style={{ color: item?.color }}
      >
        {trackedShare}% of tracked · {plannedShare}% of planned
      </p>
    </div>
  );
}

export default function PlanDonutCard({
  tab,
  donutChartData,
  totalTracked,
  totalPlanned,
  totalRemaining,
  progress,
  currency,
}) {
  const legendItems = donutChartData.filter(
    (item) => !item.isRemainder && !item.isEmpty && Number(item.tracked || 0) > 0
  );

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
              paddingAngle={donutChartData.length > 1 ? 3 : 0}
              stroke="none"
              isAnimationActive
            >
              {donutChartData.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={entry.color || '#E5E7EB'}
                  stroke="none"
                  tabIndex={-1}
                  focusable="false"
                  style={{ outline: 'none' }}
                />
              ))}
            </Pie>

            <Tooltip
              content={
                <DonutTooltip
                  currency={currency}
                  tab={tab}
                  totalTracked={totalTracked}
                  totalPlanned={totalPlanned}
                />
              }
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

      <div className="mt-3 flex justify-center overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {legendItems.length > 0 ? (
          <div className="flex min-w-0 flex-nowrap justify-center gap-1.5">
            {legendItems.map((item) => (
              <div
                key={item.id || item.name}
                className="inline-flex max-w-[68px] shrink items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2 py-1 shadow-sm sm:max-w-[92px]"
                title={item.name}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />

                <span className="min-w-0 truncate text-[10px] font-semibold leading-none text-muted-foreground">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-[11px] font-medium text-muted-foreground">
            No tracked categories yet
          </p>
        )}
      </div>
    </div>
  );
}
