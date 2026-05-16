import { useMemo, useRef } from 'react';
import { BarChart3, Target } from 'lucide-react';
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
import {
  CurrencyAmount,
  formatCurrencyText,
} from './ReflectSummaryCard.jsx';

const CHART_WRAP_CLASS =
  'w-full min-w-0 overflow-visible [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper]:overflow-visible [&_.recharts-surface]:outline-none [&_.recharts-surface]:overflow-visible [&_.recharts-sector]:outline-none [&_.recharts-bar-rectangle]:outline-none [&_*]:focus:outline-none';

const getChartAnimation = (active) => ({
  isAnimationActive: active,
  animationDuration: active ? 750 : 0,
  animationEasing: 'ease-out',
});

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
};

const tooltipProps = {
  cursor: false,
  allowEscapeViewBox: { x: true, y: true },
  wrapperStyle: {
    zIndex: 60,
    pointerEvents: 'none',
  },
};

const donutTooltipProps = {
  ...tooltipProps,
  position: { x: 178, y: 18 },
};

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
      className="min-w-0 overflow-visible"
    >
      {children(isInView)}
    </motion.div>
  );
}

function ChartShell({ className = '' }) {
  return (
    <div
      className={`${className} flex items-center justify-center rounded-2xl bg-muted/20`}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  );
}

export default function ReflectCharts({
  isYear,
  cashFlow,
  spendingBreakdown,
  spendingTrend,
  efficiency,
  leftToAllocate,
  currency,
  tooltipStyle,
}) {
  const safeCashFlow = Array.isArray(cashFlow) ? cashFlow : [];
  const safeSpendingBreakdown = Array.isArray(spendingBreakdown)
    ? spendingBreakdown
    : [];
  const safeSpendingTrend = Array.isArray(spendingTrend) ? spendingTrend : [];

  const safeEfficiency = Number.isFinite(Number(efficiency))
    ? Number(efficiency)
    : 0;

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

  const ringScore = isYear ? yearSpendingRatio : safeEfficiency;

  const ringColor = isYear
    ? yearSpendingRatio <= 65
      ? 'hsl(var(--success))'
      : yearSpendingRatio <= 85
        ? 'hsl(var(--warning))'
        : 'hsl(var(--destructive))'
    : safeEfficiency >= 70
      ? 'hsl(var(--success))'
      : safeEfficiency >= 40
        ? 'hsl(var(--warning))'
        : 'hsl(var(--destructive))';

  const totalCategorySpend = useMemo(
    () =>
      safeSpendingBreakdown.reduce(
        (sum, item) => sum + Number(item.value || 0),
        0
      ),
    [safeSpendingBreakdown]
  );

  const groupedSpendingBreakdown = useMemo(() => {
    const withPercents = safeSpendingBreakdown.map((item) => ({
      ...item,
      color: item.color || 'hsl(var(--muted-foreground))',
      percent:
        totalCategorySpend > 0
          ? (Number(item.value || 0) / totalCategorySpend) * 100
          : 0,
    }));

    if (withPercents.length <= 5) {
      return withPercents;
    }

    const topItems = withPercents.slice(0, 5);
    const otherItems = withPercents.slice(5);

    const othersValue = otherItems.reduce(
      (sum, item) => sum + Number(item.value || 0),
      0
    );

    return [
      ...topItems,
      {
        name: 'Others',
        value: othersValue,
        color: 'hsl(var(--muted-foreground))',
        percent:
          totalCategorySpend > 0
            ? (othersValue / totalCategorySpend) * 100
            : 0,
      },
    ];
  }, [safeSpendingBreakdown, totalCategorySpend]);

  return (
    <>
      <div className="mb-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <RevealChartCard>
          {(isVisible) => (
            <ReflectCard className="overflow-visible p-5">
              <div className="mb-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  {isYear
                    ? 'Cash Flow — Year by Quarter'
                    : 'Cash Flow — Recent 3 Months'}
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {isYear
                    ? 'Income and expenses grouped by quarter'
                    : 'Selected month with the previous two months'}
                </p>
              </div>

              <div className={`${CHART_WRAP_CLASS} h-64 min-h-[256px]`}>
                {isVisible ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={safeCashFlow}
                      barGap={6}
                      barCategoryGap="32%"
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
                        contentStyle={tooltipStyle}
                        formatter={(value) =>
                          formatCurrencyText(value, currency)
                        }
                      />

                      <Bar
                        dataKey="income"
                        fill="hsl(var(--success))"
                        radius={[8, 8, 0, 0]}
                        activeBar={false}
                        {...getChartAnimation(isVisible)}
                      />

                      <Bar
                        dataKey="expenses"
                        fill="hsl(var(--destructive))"
                        radius={[8, 8, 0, 0]}
                        activeBar={false}
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

        <RevealChartCard>
          {(isVisible) => (
            <ReflectCard className="p-5">
              <div className="mb-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  {isYear ? 'Yearly Spending Pace' : 'Budget Efficiency'}
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {isYear
                    ? 'Tracked expenses compared with tracked income'
                    : 'How closely spending follows your plan'}
                </p>
              </div>

              <div className="flex items-center justify-center py-3">
                <div className="relative h-40 w-40">
                  <svg viewBox="0 0 36 36" className="h-40 w-40 -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="hsl(var(--secondary))"
                      strokeWidth="3"
                    />

                    <motion.path
                      initial={{ strokeDasharray: '0, 100' }}
                      animate={{
                        strokeDasharray: `${
                          isVisible ? Math.max(0, Math.min(100, ringScore)) : 0
                        }, 100`,
                      }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">
                      {isYear ? `${yearSpendingRatio}%` : `${safeEfficiency}%`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isYear ? 'used' : 'score'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-x-1 gap-y-1 text-center text-sm font-medium">
                {isYear ? (
                  totalTrackedIncome > 0 ? (
                    <>
                      <CurrencyAmount
                        amount={totalTrackedExpenses}
                        currency={currency}
                        compact
                      />
                      <span>spent from</span>
                      <CurrencyAmount
                        amount={totalTrackedIncome}
                        currency={currency}
                        compact
                      />
                      <span>tracked income.</span>
                    </>
                  ) : (
                    'Add income transactions to calculate yearly spending pace.'
                  )
                ) : leftToAllocate === 0 ? (
                  'Every planned amount is allocated.'
                ) : leftToAllocate > 0 ? (
                  <>
                    <CurrencyAmount
                      amount={leftToAllocate}
                      currency={currency}
                      compact
                    />
                    <span>still left to allocate.</span>
                  </>
                ) : (
                  <>
                    <CurrencyAmount
                      amount={Math.abs(leftToAllocate)}
                      currency={currency}
                      compact
                    />
                    <span>over-allocated.</span>
                  </>
                )}
              </div>
            </ReflectCard>
          )}
        </RevealChartCard>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <RevealChartCard>
          {(isVisible) => (
            <ReflectCard className="overflow-visible p-5">
              <h3 className="mb-4 text-sm font-semibold">
                Top Spending Categories
              </h3>

              {groupedSpendingBreakdown.length > 0 ? (
                <div className="flex flex-col items-center gap-6 overflow-visible md:flex-row lg:flex-col xl:flex-row">
                  <div className="relative h-44 w-44 shrink-0 overflow-visible">
                    <div className={`${CHART_WRAP_CLASS} h-44 w-44`}>
                      {isVisible ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart margin={{ top: 0, right: 90, bottom: 0, left: 0 }}>
                            <Pie
                              data={groupedSpendingBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={72}
                              paddingAngle={3}
                              dataKey="value"
                              stroke="hsl(var(--card))"
                              strokeWidth={2}
                              activeShape={false}
                              {...getChartAnimation(isVisible)}
                            >
                              {groupedSpendingBreakdown.map((entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={entry.color}
                                  tabIndex={-1}
                                  focusable="false"
                                  style={{ outline: 'none' }}
                                />
                              ))}
                            </Pie>

                            <Tooltip
                              {...donutTooltipProps}
                              contentStyle={tooltipStyle}
                              formatter={(value) =>
                                formatCurrencyText(value, currency)
                              }
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <ChartShell className="h-full" />
                      )}
                    </div>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Total
                      </span>
                      <span className="mt-1 text-sm font-bold tabular-nums">
                        <CurrencyAmount
                          amount={totalCategorySpend}
                          currency={currency}
                          compact
                        />
                      </span>
                    </div>
                  </div>

                  <div className="w-full flex-1 space-y-3">
                    {groupedSpendingBreakdown.map((category) => (
                      <div
                        key={category.name}
                        className="flex items-center gap-3"
                      >
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />

                        <span className="min-w-0 flex-1 truncate text-sm">
                          {category.name}
                        </span>

                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                          {formatPercent(category.percent)}
                        </span>

                        <span className="text-sm font-medium tabular-nums">
                          <CurrencyAmount
                            amount={category.value}
                            currency={currency}
                            compact
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
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
            <ReflectCard className="overflow-visible p-5">
              <h3 className="mb-4 text-sm font-semibold">
                {isYear
                  ? 'Monthly Spending This Year'
                  : 'Daily Spending This Month'}
              </h3>

              {safeSpendingTrend.length > 0 ? (
                <div className={`${CHART_WRAP_CLASS} h-56 min-h-[224px]`}>
                  {isVisible ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={safeSpendingTrend}>
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
                          contentStyle={tooltipStyle}
                          formatter={(value) =>
                            formatCurrencyText(value, currency)
                          }
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
                          activeDot={false}
                          {...getChartAnimation(isVisible)}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <ChartShell className="h-full" />
                  )}
                </div>
              ) : (
                <div className="py-12 text-center">
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