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

function getTooltipSurfaceStyle(tab) {
  const toneColor = tab?.color || 'hsl(var(--primary))';

  return {
    backgroundColor: `color-mix(in srgb, ${toneColor} 12%, hsl(var(--popover)) 88%)`,
    borderColor: `color-mix(in srgb, ${toneColor} 24%, hsl(var(--border)) 76%)`,
  };
}

function DonutTooltip({ active, payload, currency, tab }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  const value = Number(item?.value || 0);
  const tracked = Number(item?.tracked || 0);
  const amount = item?.isRemainder ? value : tracked;
  const actionLabel = getTooltipActionLabel(tab, item);
  const title = item?.isRemainder ? 'Untracked' : item?.name;

  return (
    <div
      className="rounded-xl border px-3 py-2 shadow-lg"
      style={getTooltipSurfaceStyle(tab)}
    >
      <p className="max-w-[160px] truncate text-xs font-bold text-popover-foreground tabular-nums">
        {title}
      </p>

      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{actionLabel}</span>
        <PlanMoney
          amount={amount}
          currency={currency}
          compact
          className="font-semibold text-popover-foreground"
        />
      </div>
    </div>
  );
}

function getEmptyLegendLabel(tab) {
  if (tab?.key === 'income') return 'No income received yet';
  if (tab?.key === 'expense') return 'No spending recorded yet';
  if (tab?.key === 'savings') return 'No savings recorded yet';
  if (tab?.key === 'debt') return 'No debt payments recorded yet';

  return 'No activity recorded yet';
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

      <div className="mt-3 flex justify-center pb-0.5">
        {legendItems.length > 0 ? (
          <div className="flex w-full flex-wrap items-center justify-center gap-1.5 text-center">
            {legendItems.map((item) => (
              <div
                key={item.id || item.name}
                className="inline-flex min-h-7 max-w-[9.5rem] items-center justify-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-center shadow-sm"
                title={item.name}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />

                <span className="min-w-0 whitespace-normal break-words text-[10px] font-semibold leading-tight text-muted-foreground">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-[11px] font-medium text-muted-foreground">
            {getEmptyLegendLabel(tab)}
          </p>
        )}
      </div>
    </div>
  );
}
