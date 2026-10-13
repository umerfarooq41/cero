import { useMemo, useRef, useState } from 'react';
import { BarChart3, ChartPie, LineChart, Target } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import ReflectCard from './ReflectCard.jsx';
import { CurrencyAmount } from './ReflectSummaryCard.jsx';

const CHART_WRAP_CLASS =
  'w-full min-w-0 select-none [-webkit-tap-highlight-color:transparent] [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper]:select-none [&_.recharts-surface]:outline-none [&_.recharts-surface]:select-none [&_.recharts-layer]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-bar-rectangle]:outline-none [&_.recharts-rectangle]:outline-none [&_.recharts-active-bar]:outline-none [&_.recharts-tooltip-cursor]:hidden [&_.recharts-dot]:outline-none [&_.recharts-active-dot]:hidden [&_svg]:outline-none [&_svg_*]:outline-none [&_*]:focus:outline-none [&_*]:focus-visible:outline-none';

const getChartAnimation = (active) => ({
  isAnimationActive: active,
  animationDuration: active ? 750 : 0,
  animationEasing: 'ease-out',
});

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
};

const THEME_CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.86)',
  'hsl(var(--primary) / 0.72)',
  'hsl(var(--primary) / 0.58)',
  'hsl(var(--primary) / 0.42)',
  'hsl(var(--primary) / 0.28)',
];

const getThemeChartColor = (index = 0) =>
  THEME_CHART_COLORS[index % THEME_CHART_COLORS.length];

const SOLID_RECHARTS_TOOLTIP_STYLE = {
  background: 'var(--app-recharts-tooltip-bg)',
  backgroundColor: 'hsl(var(--popover) / 0.98)',
  border: '1px solid var(--app-recharts-tooltip-border)',
  borderRadius: '14px',
  boxShadow: 'var(--app-recharts-tooltip-shadow)',
  color: 'hsl(var(--popover-foreground))',
  fontSize: '12px',
  opacity: 1,
  backdropFilter: 'none',
};

const tooltipProps = {
  cursor: false,
  allowEscapeViewBox: { x: false, y: false },
  wrapperStyle: {
    zIndex: 9999,
    pointerEvents: 'none',
  },
};

const donutTooltipProps = {
  cursor: false,
  allowEscapeViewBox: { x: false, y: false },
  wrapperStyle: {
    zIndex: 9999,
    pointerEvents: 'none',
  },
};

function TooltipCurrencyValue({ value, currency }) {
  return (
    <CurrencyAmount
      amount={Number(value || 0)}
      currency={currency}
      compact
      className="font-semibold text-popover-foreground"
    />
  );
}


function getDonutTooltipSurfaceStyle(item) {
  const toneColor = item?.color || 'hsl(var(--primary))';

  return {
    backgroundColor: `color-mix(in srgb, ${toneColor} 12%, hsl(var(--popover)) 88%)`,
    borderColor: `color-mix(in srgb, ${toneColor} 24%, hsl(var(--border)) 76%)`,
  };
}

function DonutTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  if (!item) return null;

  const value = Number(item.value || 0);
  const percent = Number(item.percent || 0);

  return (
    <div
      className="rounded-xl border px-3 py-2 shadow-lg"
      style={getDonutTooltipSurfaceStyle(item)}
    >
      <p className="max-w-[170px] truncate text-xs font-bold text-popover-foreground">
        {item.name}
      </p>

      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <CurrencyAmount
          amount={value}
          currency={currency}
          compact
          className="font-semibold text-popover-foreground"
        />
        <span className="font-medium tabular-nums">
          {formatPercent(percent)}
        </span>
      </div>
    </div>
  );
}

function RevealChartCard({ children }) {
  const ref = useRef(null);

  const isInView = useInView(ref, {
    once: true,
    amount: 0.25,
    margin: '0px 0px -90px 0px',
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22, scale: 0.985 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 22, scale: 0.985 }
      }
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="min-w-0 lg:h-full"
    >
      {children(isInView)}
    </motion.div>
  );
}

function ChartShell({ className = '' }) {
  return (
    <div
      className={`${className} flex items-center justify-center rounded-2xl app-card-surface-soft`}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}

function ChartHeading({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-2 min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

        <h3 className="min-w-0 text-sm font-bold leading-5 tracking-tight text-foreground">
          {title}
        </h3>
      </div>

      {subtitle ? (
        <p className="mt-1 text-left text-[11px] leading-4 text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export default function ReflectCharts({
  isYear,
  cashFlow,
  spendingBreakdown,
  spendingTrend,
  efficiency,
  expenses = 0,
  plannedExpenses = 0,
  currency,
  tooltipStyle = SOLID_RECHARTS_TOOLTIP_STYLE,
}) {
  const safeCashFlow = Array.isArray(cashFlow) ? cashFlow : [];
  const safeSpendingBreakdown = Array.isArray(spendingBreakdown)
    ? spendingBreakdown
    : [];
  const safeSpendingTrend = Array.isArray(spendingTrend) ? spendingTrend : [];
  const [selectedDay, setSelectedDay] = useState(null);

  const safeEfficiency = Number.isFinite(Number(efficiency))
    ? Number(efficiency)
    : 0;

  const safeExpenses = Number.isFinite(Number(expenses)) ? Number(expenses) : 0;
  const safePlannedExpenses = Number.isFinite(Number(plannedExpenses))
    ? Number(plannedExpenses)
    : 0;

  const activeDay = safeSpendingTrend.find(item => item.label === selectedDay) || safeSpendingTrend[safeSpendingTrend.length - 1];
  const totalTrackedIncome = useMemo(
    () =>
      safeCashFlow.reduce(
        (sum, item) => sum + Number(item.income || 0),
        0
      ),
    [safeCashFlow]
  );

  const totalTrackedExpenses = useMemo(
    () =>
      safeCashFlow.reduce(
        (sum, item) => sum + Number(item.expenses || 0),
        0
      ),
    [safeCashFlow]
  );

  const yearSpendingRatio =
    isYear && totalTrackedIncome > 0
      ? Math.min(
          100,
          Math.round((totalTrackedExpenses / totalTrackedIncome) * 100)
        )
      : 0;

 const roundedBudgetUsage = Math.round(safeEfficiency);
const ringScore = isYear ? yearSpendingRatio : roundedBudgetUsage;

  const ringColor = 'hsl(var(--primary))';

  const totalCategorySpend = useMemo(
    () =>
      safeSpendingBreakdown.reduce(
        (sum, item) => sum + Number(item.value || 0),
        0
      ),
    [safeSpendingBreakdown]
  );

  const groupedSpendingBreakdown = useMemo(() => {
    const sorted = [...safeSpendingBreakdown]
      .filter((item) => Number(item.value || 0) > 0)
      .sort((a, b) => Number(b.value || 0) - Number(a.value || 0));

    const withPercents = sorted.map((item, index) => ({
      ...item,
      color: getThemeChartColor(index),
      percent: Number(item.planned || 0) > 0
        ? (Number(item.value || 0) / Number(item.planned)) * 100
        : (Math.max(...sorted.map(c => Number(c.value || 0)), 1) > 0 ? Number(item.value || 0) / Math.max(...sorted.map(c => Number(c.value || 0)), 1) * 100 : 0),
    }));

    if (withPercents.length <= 4) {
      return withPercents;
    }

    const topItems = withPercents.slice(0, 4);
    const otherItems = withPercents.slice(4);

    const othersValue = otherItems.reduce(
      (sum, item) => sum + Number(item.value || 0),
      0
    );

    return [
      ...topItems,
      {
        name: 'Others',
        value: othersValue,
        color: getThemeChartColor(4),
        percent:
          totalCategorySpend > 0
            ? (othersValue / totalCategorySpend) * 100
            : 0,
      },
    ];
  }, [safeSpendingBreakdown, totalCategorySpend]);

  return (
    <>
      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <RevealChartCard>
          {(isVisible) => (
            <ReflectCard className="p-3 sm:p-4">
              <ChartHeading
                icon={BarChart3}
                tone="info"
                title={
                  isYear
                    ? 'Cash Flow - Year by Quarter'
                    : 'Cash Flow - Recent 3 Months'
                }
                subtitle={
                  isYear
                    ? 'Income and expenses grouped by quarter'
                    : 'Selected month with the previous two months'
                }
              />

              <div className={`${CHART_WRAP_CLASS} h-40 min-h-[160px] sm:h-44 sm:min-h-[176px]`}>
                {isVisible ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={safeCashFlow}
                      barGap={6}
                      barCategoryGap="32%"
                      margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.55}
                      />

                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: 'hsl(var(--muted-foreground))',
                        }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: 'hsl(var(--muted-foreground))',
                        }}
                        width={42}
                      />

                      <Tooltip
                        {...tooltipProps}
                        cursor={false}
                        contentStyle={{
                          ...tooltipStyle,
                          maxWidth: 220,
                          whiteSpace: 'normal',
                        }}
                        formatter={(value) => (
                          <TooltipCurrencyValue value={value} currency={currency} />
                        )}
                      />

                      <Bar
                        dataKey="income"
                        fill="hsl(var(--primary))"
                        radius={[8, 8, 0, 0]}
                        activeBar={false}
                        style={{
                          outline: 'none',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        {...getChartAnimation(isVisible)}
                      />

                      <Bar
                        dataKey="expenses"
                        fill="hsl(var(--primary) / 0.45)"
                        radius={[8, 8, 0, 0]}
                        activeBar={false}
                        style={{
                          outline: 'none',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                        {...getChartAnimation(isVisible)}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ChartShell className="h-full" />
                )}
              </div>
            </ReflectCard>
          )}
        </RevealChartCard>


      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-2 lg:gap-4">
        <RevealChartCard>
          {(isVisible) => (
            <ReflectCard className="p-3 sm:p-4">
              <ChartHeading
                icon={ChartPie}
                tone="warning"
                title="Spending categories"
                subtitle="Budget usage where planned; otherwise relative spending"
              />

              {groupedSpendingBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {groupedSpendingBreakdown.map(category => (
                    <div key={category.id || category.name} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="min-w-0 truncate text-foreground">{category.name}</span>
                        <span className="shrink-0 font-semibold tabular-nums"><CurrencyAmount amount={category.value} currency={currency} compact /></span>
                      </div>
                      {category.planned > 0 ? <p className="text-[10px] text-muted-foreground">of <CurrencyAmount amount={category.planned} currency={currency} compact /> planned · {Math.round(category.percent)}% used</p> : null}
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, category.percent)}%`, backgroundColor: category.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm font-medium">No expense data yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add expenses to see category breakdown.
                  </p>
                </div>
              )}
            </ReflectCard>
          )}
        </RevealChartCard>

        <RevealChartCard>
          {(isVisible) => (
            <ReflectCard className="p-3 sm:p-4">
              <ChartHeading
                icon={LineChart}
                tone="info"
                title={
                  isYear
                    ? 'Monthly Spending This Year'
                    : 'Daily Spending This Month'
                }
                subtitle={
                  isYear
                    ? 'Expense movement across the selected year'
                    : 'Daily expense movement in the selected month'
                }
              />

              {safeSpendingTrend.length > 0 ? (
                <>
                {activeDay ? <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{isYear ? activeDay.label : `Day ${activeDay.label}`}</span>
                  <span className="font-semibold tabular-nums"><CurrencyAmount amount={activeDay.amount} currency={currency} compact /></span>
                </div> : null}
                <div className={`${CHART_WRAP_CLASS} h-44 min-h-[176px] sm:h-48 sm:min-h-[192px]`}>
                  {isVisible ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={safeSpendingTrend}
                        onMouseMove={state => { if (state?.activePayload?.[0]?.payload?.label) setSelectedDay(state.activePayload[0].payload.label); }}
                        onTouchMove={state => { if (state?.activePayload?.[0]?.payload?.label) setSelectedDay(state.activePayload[0].payload.label); }}
                        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid
                          vertical={false}
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          opacity={0.55}
                        />

                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 11,
                            fill: 'hsl(var(--muted-foreground))',
                          }}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 11,
                            fill: 'hsl(var(--muted-foreground))',
                          }}
                          width={38}
                        />

                        <Tooltip
                          {...tooltipProps}
                          cursor={false}
                          contentStyle={{
                            ...tooltipStyle,
                            maxWidth: 150,
                            whiteSpace: 'normal',
                          }}
                          formatter={(value) => (
                            <TooltipCurrencyValue value={value} currency={currency} />
                          )}
                          labelFormatter={(label) =>
                            isYear ? label : `Day ${label}`
                          }
                        />

                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.14}
                          strokeWidth={2.5}
                          activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                          dot={false}
                          style={{
                            outline: 'none',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                          {...getChartAnimation(isVisible)}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartShell className="h-full" />
                  )}
                </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm font-medium">No spending data yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expense transactions will appear here.
                  </p>
                </div>
              )}
            </ReflectCard>
          )}
        </RevealChartCard>
      </div>
    </>
  );
}