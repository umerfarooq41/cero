import { BarChart3, Target } from 'lucide-react';
import { motion } from 'framer-motion';
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
  'w-full min-w-0 [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none [&_.recharts-sector]:outline-none [&_.recharts-bar-rectangle]:outline-none [&_*]:focus:outline-none';

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
  return (
    <>
      <div className="mb-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <ReflectCard className="p-5">
          <div className="mb-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              {isYear ? 'Cash Flow — Full Year' : 'Cash Flow — Last 6 Months'}
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Income and expenses by month
            </p>
          </div>

          <div className={`${CHART_WRAP_CLASS} h-64 min-h-[256px]`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlow} barGap={6} barCategoryGap="28%">
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
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  width={42}
                />

                <Tooltip
                  cursor={false}
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatCurrencyText(value, currency)}
                />

                <Bar
                  dataKey="income"
                  fill="#16A34A"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={false}
                />

                <Bar
                  dataKey="expenses"
                  fill="#EF4444"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ReflectCard>

        <ReflectCard className="p-5">
          <div className="mb-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-muted-foreground" />
              Budget Efficiency
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              {isYear
                ? 'Available for monthly budget review'
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
                    strokeDasharray: `${isYear ? 0 : efficiency || 0}, 100`,
                  }}
                  transition={{ duration: 0.8 }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={
                    isYear
                      ? '#69797E'
                      : efficiency >= 70
                        ? '#16A34A'
                        : efficiency >= 40
                          ? '#F59E0B'
                          : '#EF4444'
                  }
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">
                  {isYear ? '—' : `${efficiency}%`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isYear ? 'year view' : 'score'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-1 gap-y-1 text-center text-sm font-medium">
            {isYear ? (
              'Select a month to review allocation accuracy.'
            ) : leftToAllocate === 0 ? (
              'Every planned amount is allocated.'
            ) : leftToAllocate > 0 ? (
              <>
                <CurrencyAmount amount={leftToAllocate} currency={currency} compact />
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
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <ReflectCard className="p-5">
          <h3 className="mb-4 text-sm font-semibold">
            Top Spending Categories
          </h3>

          {spendingBreakdown.length > 0 ? (
            <div className="flex flex-col items-center gap-6 md:flex-row lg:flex-col xl:flex-row">
              <div className={`${CHART_WRAP_CLASS} h-44 w-44 shrink-0`}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      isAnimationActive={false}
                      stroke="hsl(var(--card))"
                      strokeWidth={2}
                    >
                      {spendingBreakdown.map((entry) => (
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
                      cursor={false}
                      contentStyle={tooltipStyle}
                      formatter={(value) => formatCurrencyText(value, currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full flex-1 space-y-3">
                {spendingBreakdown.map((category) => (
                  <div key={category.name} className="flex items-center gap-3">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />

                    <span className="flex-1 truncate text-sm">
                      {category.name}
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

        <ReflectCard className="p-5">
          <h3 className="mb-4 text-sm font-semibold">
            {isYear ? 'Monthly Spending This Year' : 'Daily Spending This Month'}
          </h3>

          {spendingTrend.length > 0 ? (
            <div className={`${CHART_WRAP_CLASS} h-56 min-h-[224px]`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingTrend}>
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
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    width={38}
                  />

                  <Tooltip
                    cursor={false}
                    contentStyle={tooltipStyle}
                    formatter={(value) => formatCurrencyText(value, currency)}
                    labelFormatter={(label) => (isYear ? label : `Day ${label}`)}
                  />

                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#0078D4"
                    fill="#0078D4"
                    fillOpacity={0.12}
                    strokeWidth={2.5}
                    isAnimationActive={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
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
      </div>
    </>
  );
}