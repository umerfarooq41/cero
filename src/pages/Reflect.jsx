import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Brain,
  CreditCard,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
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
import { motion } from 'framer-motion';

import PageHeader from '@/components/layout/PageHeader.jsx';
import ReflectCard from '@/components/reflect/ReflectCard.jsx';
import ReflectPeriodSelector from '@/components/reflect/ReflectPeriodSelector.jsx';
import ReflectSummaryCard, {
  CurrencyAmount,
  InlineMoney,
  formatCurrencyText,
} from '@/components/reflect/ReflectSummaryCard.jsx';
import ReflectInsightCard from '@/components/reflect/ReflectInsightCard.jsx';

import {
  useAccounts,
  useAllTransactions,
  useBudgetSummary,
  useCategories,
} from '@/hooks/useBudgetData';
import { useCurrency } from '@/hooks/useCurrency';
import useReflectAnalysis from '@/hooks/useReflectAnalysis.js';

export default function Reflect() {
  const today = new Date();

  const [selectedYear, setSelectedYear] = useState(format(today, 'yyyy'));
  const [selectedMonth, setSelectedMonth] = useState(format(today, 'MM'));

  const currency = useCurrency();

  const { data: categories = [] } = useCategories();
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: accounts = [] } = useAccounts();

  const currentMonthKey =
    selectedMonth === 'all'
      ? `${selectedYear}-01`
      : `${selectedYear}-${selectedMonth}`;

  const budget = useBudgetSummary(currentMonthKey);

  const analysis = useReflectAnalysis({
    selectedYear,
    selectedMonth,
    allTransactions,
    accounts,
    categories,
    budget,
  });

  const {
    isYear,
    income,
    expenses,
    plannedIncome,
    plannedExpenses,
    leftToAllocate,
    netCashFlow,
    netWorth,
    totalAssets,
    totalLiabilities,
    savingsRate,
    efficiency,
    spendingBreakdown,
    cashFlow,
    spendingTrend,
    topCategory,
  } = analysis;

  const insights = [
    {
      icon: netCashFlow >= 0 ? TrendingUp : TrendingDown,
      title: netCashFlow >= 0 ? 'Positive cash flow' : 'Negative cash flow',
      text:
        netCashFlow >= 0 ? (
          <>
            You kept{' '}
            <InlineMoney>
              <CurrencyAmount amount={netCashFlow} currency={currency} compact />
            </InlineMoney>{' '}
            after expenses in this period.
          </>
        ) : (
          <>
            You spent{' '}
            <InlineMoney>
              <CurrencyAmount
                amount={Math.abs(netCashFlow)}
                currency={currency}
                compact
              />
            </InlineMoney>{' '}
            more than your income in this period.
          </>
        ),
      tone: netCashFlow >= 0 ? 'good' : 'bad',
    },
    {
      icon: Target,
      title: 'Budget efficiency',
      text: isYear
        ? 'Year view summarizes actual transactions. Monthly budget efficiency appears when a single month is selected.'
        : efficiency >= 80
          ? 'Strong control. Your spending is close to your planned budget.'
          : efficiency >= 50
            ? 'Some categories may need review before month end.'
            : 'Spending is far from plan. Review your largest categories.',
      tone: isYear
        ? 'default'
        : efficiency >= 80
          ? 'good'
          : efficiency >= 50
            ? 'warning'
            : 'bad',
    },
    {
      icon: topCategory ? CreditCard : Brain,
      title: topCategory ? `Largest spend: ${topCategory.name}` : 'No spending yet',
      text: topCategory ? (
        <>
          {topCategory.name} used{' '}
          <InlineMoney>
            <CurrencyAmount
              amount={topCategory.value}
              currency={currency}
              compact
            />
          </InlineMoney>{' '}
          in this period.
        </>
      ) : (
        'Once you add expenses, your top spending categories will appear here.'
      ),
      tone: topCategory ? 'default' : 'good',
    },
    {
      icon: PiggyBank,
      title: 'Savings rate',
      text:
        income > 0
          ? `Your estimated savings rate is ${savingsRate}%.`
          : 'Add income transactions to calculate your savings rate.',
      tone: savingsRate >= 20 ? 'good' : savingsRate < 0 ? 'bad' : 'warning',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Reflect"
        subtitle="Insights, trends, and financial clarity"
      />

      <main className="mx-auto w-full max-w-5xl px-4 py-4 pb-24 lg:py-8">
        <ReflectPeriodSelector
          year={selectedYear}
          month={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
        />

        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ReflectSummaryCard
            title="Income"
            value={<CurrencyAmount amount={income} currency={currency} />}
            subtitle={
              !isYear && plannedIncome > 0 ? (
                <>
                  <CurrencyAmount
                    amount={plannedIncome}
                    currency={currency}
                    compact
                  />
                  <span>planned</span>
                </>
              ) : isYear ? (
                'Full-year total'
              ) : (
                'No planned income'
              )
            }
            icon={ArrowUpRight}
            tone="good"
          />

          <ReflectSummaryCard
            title="Expenses"
            value={<CurrencyAmount amount={expenses} currency={currency} />}
            subtitle={
              !isYear && plannedExpenses > 0 ? (
                <>
                  <CurrencyAmount
                    amount={plannedExpenses}
                    currency={currency}
                    compact
                  />
                  <span>planned</span>
                </>
              ) : isYear ? (
                'Full-year total'
              ) : (
                'No planned expenses'
              )
            }
            icon={ArrowDownRight}
            tone={expenses > plannedExpenses && plannedExpenses > 0 ? 'bad' : 'blue'}
          />

          <ReflectSummaryCard
            title="Net Cash Flow"
            value={<CurrencyAmount amount={netCashFlow} currency={currency} />}
            subtitle={savingsRate ? `${savingsRate}% savings rate` : 'This period'}
            icon={Wallet}
            tone={netCashFlow >= 0 ? 'good' : 'bad'}
          />

          <ReflectSummaryCard
            title="Net Worth"
            value={<CurrencyAmount amount={netWorth} currency={currency} />}
            subtitle={
              <>
                <CurrencyAmount amount={totalAssets} currency={currency} compact />
                <span>assets •</span>
                <CurrencyAmount
                  amount={totalLiabilities}
                  currency={currency}
                  compact
                />
                <span>debt</span>
              </>
            }
            icon={TrendingUp}
            tone={netWorth >= 0 ? 'purple' : 'bad'}
          />
        </div>

        <div className="mb-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <ReflectCard className="p-5">
            <div className="mb-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                {isYear ? 'Cash Flow — Full Year' : 'Cash Flow — Last 6 Months'}
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Income, expenses, and monthly net
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlow} barGap={4}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />

                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />

                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => formatCurrencyText(value, currency)}
                  />

                  <Bar
                    dataKey="income"
                    fill="#107C10"
                    radius={[6, 6, 0, 0]}
                    animationDuration={900}
                  />

                  <Bar
                    dataKey="expenses"
                    fill="#C50F1F"
                    radius={[6, 6, 0, 0]}
                    animationDuration={900}
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
                    transition={{ duration: 1 }}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={
                      isYear
                        ? '#69797E'
                        : efficiency >= 70
                          ? '#107C10'
                          : efficiency >= 40
                            ? '#FFB900'
                            : '#C50F1F'
                    }
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">
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
        </div>

        <div className="mb-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <ReflectCard className="p-5">
            <h3 className="mb-4 text-sm font-semibold">
              Top Spending Categories
            </h3>

            {spendingBreakdown.length > 0 ? (
              <div className="flex flex-col items-center gap-6 md:flex-row lg:flex-col xl:flex-row">
                <div className="h-44 w-44 shrink-0">
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
                        animationDuration={900}
                      >
                        {spendingBreakdown.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                        formatter={(value) => formatCurrencyText(value, currency)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full flex-1 space-y-3">
                  {spendingBreakdown.map((category) => (
                    <div key={category.name} className="flex items-center gap-3">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
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
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spendingTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />

                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />

                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(value) => formatCurrencyText(value, currency)}
                      labelFormatter={(label) =>
                        isYear ? label : `Day ${label}`
                      }
                    />

                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#0078D4"
                      fill="#0078D4"
                      fillOpacity={0.14}
                      strokeWidth={2}
                      animationDuration={900}
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

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Smart Insights</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {insights.map((insight) => (
              <ReflectInsightCard
                key={insight.title}
                icon={insight.icon}
                title={insight.title}
                text={insight.text}
                tone={insight.tone}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
