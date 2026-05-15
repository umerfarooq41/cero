import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Brain,
  CreditCard,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader.jsx';
import ReflectPeriodSelector from '@/components/reflect/ReflectPeriodSelector.jsx';
import ReflectSummaryCards, {
  CurrencyAmount,
  InlineMoney,
} from '@/components/reflect/ReflectSummaryCard.jsx';
import ReflectCharts from '@/components/reflect/ReflectCharts.jsx';
import ReflectInsightCard from '@/components/reflect/ReflectInsightCard.jsx';

import {
  useAccounts,
  useAllTransactions,
  useBudgetSummary,
  useCategories,
  useUserSettings,
  useYearBudgetSummary,
} from '@/hooks/useBudgetData';
import { useCurrency } from '@/hooks/useCurrency';
import useReflectAnalysis from '@/hooks/useReflectAnalysis.js';

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '14px',
  boxShadow: '0 14px 40px rgb(0 0 0 / 0.18)',
  color: 'hsl(var(--popover-foreground))',
  fontSize: '12px',
};

export default function Reflect() {
  const today = new Date();

  const [selectedYear, setSelectedYear] = useState(format(today, 'yyyy'));
  const [selectedMonth, setSelectedMonth] = useState(format(today, 'MM'));

  const currency = useCurrency();

  const { data: categories = [] } = useCategories();
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: settings = {} } = useUserSettings();

  const isYearView = selectedMonth === 'all';

  const currentMonthKey = isYearView
    ? null
    : `${selectedYear}-${selectedMonth}`;

  const monthBudget = useBudgetSummary(currentMonthKey);
  const yearBudget = useYearBudgetSummary(selectedYear);

  const analysis = useReflectAnalysis({
    selectedYear,
    selectedMonth,
    allTransactions,
    accounts,
    categories,
    budget: isYearView ? yearBudget : monthBudget,
    settings,
  });

  const {
    isYear,
    income,
    expenses,
    trackedSavings,
    trackedDebt,
    plannedIncome,
    plannedExpenses,
    plannedSavings,
    plannedDebt,
    totalPlannedOutflow,
    totalTrackedOutflow,
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
        ? 'Yearly performance now compares year progress against expenses, savings, and debt allocations.'
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
      title: topCategory
        ? `Largest spend: ${topCategory.name}`
        : 'No spending yet',
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
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Reflect"
        subtitle="Insights, trends, and financial clarity"
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-24 lg:py-8">
        <ReflectPeriodSelector
          year={selectedYear}
          month={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
        />

        <ReflectSummaryCards
          isYear={isYear}
          income={income}
          expenses={expenses}
          trackedSavings={trackedSavings}
          trackedDebt={trackedDebt}
          plannedIncome={plannedIncome}
          plannedExpenses={plannedExpenses}
          plannedSavings={plannedSavings}
          plannedDebt={plannedDebt}
          totalPlannedOutflow={totalPlannedOutflow}
          totalTrackedOutflow={totalTrackedOutflow}
          netCashFlow={netCashFlow}
          netWorth={netWorth}
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
          savingsRate={savingsRate}
          currency={currency}
        />

        <ReflectCharts
          isYear={isYear}
          cashFlow={cashFlow}
          spendingBreakdown={spendingBreakdown}
          spendingTrend={spendingTrend}
          efficiency={efficiency}
          leftToAllocate={leftToAllocate}
          currency={currency}
          tooltipStyle={tooltipStyle}
        />

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
