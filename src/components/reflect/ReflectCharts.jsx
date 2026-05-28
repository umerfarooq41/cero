import { useMemo, useRef } from 'react';
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
    <div className="mb-3 min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

        <h3 className="min-w-0 text-sm font-bold leading-5 tracking-tight text-foreground">
          {title}
        </h3>
      </div>

      {subtitle ? (
        <p className="mt-1 truncate text-left text-xs leading-4 text-muted-foreground">
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

  const safeEfficiency = Number.isFinite(Number(efficiency))
    ? Number(efficiency)
    : 0;

  const safeExpenses = Number.isFinite(Number(expenses)) ? Number(expenses) : 0;
  const safePlannedExpenses = Number.isFinite(Number(plannedExpenses))
    ? Number(plannedExpenses)
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
      percent:
        totalCategorySpend > 0
          ? (Number(item.value || 0) / totalCategorySpend) * 100
          : 0,
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
      <div className="mb-4 grid gap-3 lg:grid-cols-2 lg:gap-4">
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

              <div className={`${CHART_WRAP_CLASS} h-52 min-h-[208px] sm:h-56 sm:min-h-[224px]`}>
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
                          maxWidth: 150,
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

        <RevealChartCard>
          {(isVisible) => (
            <ReflectCard className="p-3 sm:p-4">
              <ChartHeading
                icon={Target}
                tone={isYear ? 'warning' : 'good'}
                title={isYear ? 'Yearly Spending Pace' : 'Budget Usage'}
                subtitle={
                  isYear
                    ? 'Tracked expenses compared with tracked income'
                    : 'How much of your planned expense budget is already tracked'
                }
              />

              <div className="flex items-center justify-center py-3">
                <div className="relative h-40 w-40">
                  <svg viewBox="0 0 36 36" className="h-40 w-40 -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="hsl(var(--primary) / 0.12)"
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
                    <span className="text-lg font-bold tabular-nums sm:text-xl">
                      {isYear ? `${yearSpendingRatio}%` : `${roundedBudgetUsage}%`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      used
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-x-1 gap-y-1 text-center text-xs font-medium tabular-nums sm:text-sm">
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
                ) : safePlannedExpenses > 0 ? (
                  <>
                    <CurrencyAmount
                      amount={safeExpenses}
                      currency={currency}
                      compact
                    />
                    <span>of</span>
                    <CurrencyAmount
                      amount={safePlannedExpenses}
                      currency={currency}
                      compact
                    />
                    <span>expense budget tracked.</span>
                  </>
                ) : (
                  <>
                    <span>{safeEfficiency}% of planned expense budget tracked.</span>
                  </>
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
                title="Top Spending Categories"
                subtitle="Where your tracked expenses are concentrated"
              />

              {groupedSpendingBreakdown.length > 0 ? (
                <div className="flex flex-col items-center gap-3 md:flex-row lg:flex-col xl:flex-row">
                  <div className="relative h-32 w-32 sm:h-36 sm:w-36 shrink-0">
                    <div className={`${CHART_WRAP_CLASS} h-32 w-32 sm:h-36 sm:w-36`}>
                      {isVisible ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart
                            margin={{
                              top: 0,
                              right: 0,
                              bottom: 0,
                              left: 0,
                            }}
                          >
                            <Pie
                              data={groupedSpendingBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={34}
                              outerRadius={56}
                              paddingAngle={3}
                              dataKey="value"
                              stroke="hsl(var(--card))"
                              strokeWidth={2}
                              activeShape={false}
                              activeIndex={-1}
                              {...getChartAnimation(isVisible)}
                            >
                              {groupedSpendingBreakdown.map((entry) => (
                                <Cell
                                  key={entry.id || entry.name}
                                  fill={entry.color || getThemeChartColor(0)}
                                  tabIndex={-1}
                                  focusable="false"
                                  style={{ outline: 'none' }}
                                />
                              ))}
                            </Pie>

                            <Tooltip
                              {...donutTooltipProps}
                              cursor={false}
                              contentStyle={{
                                ...tooltipStyle,
                                zIndex: 9999,
                                maxWidth: 140,
                                whiteSpace: 'normal',
                              }}
                              formatter={(value) => (
                                <TooltipCurrencyValue value={value} currency={currency} />
                              )}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <ChartShell className="h-full" />
                      )}
                    </div>

                    <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center text-center">
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

                  <div className="w-full flex-1 space-y-2">
                    {groupedSpendingBreakdown.map((category) => {
                      const categoryColor = category.color || getThemeChartColor(0);

                      return (
                        <div
                          key={category.id || category.name}
                          className="flex min-w-0 items-center gap-2"
                        >
                          <div
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />

                          <span className="min-w-0 flex-1 truncate text-xs sm:text-sm">
                            {category.name}
                          </span>

                          <span className="text-xs font-medium text-muted-foreground tabular-nums">
                            {formatPercent(category.percent)}
                          </span>

                          <span className="text-xs font-medium tabular-nums sm:text-sm">
                            <CurrencyAmount
                              amount={category.value}
                              currency={currency}
                              compact
                            />
                          </span>
                        </div>
                      );
                    })}
                  </div>
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
                <div className={`${CHART_WRAP_CLASS} h-48 min-h-[192px] sm:h-52 sm:min-h-[208px]`}>
                  {isVisible ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={safeSpendingTrend}
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
                          activeDot={false}
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