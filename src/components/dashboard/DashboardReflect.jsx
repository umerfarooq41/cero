import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CreditCard,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import ReflectPeriodSelector from '@/components/reflect/ReflectPeriodSelector.jsx';
import ReflectSummaryCards, {
  CurrencyAmount,
  InlineMoney,
} from '@/components/reflect/ReflectSummaryCard.jsx';
import ReflectCharts from '@/components/reflect/ReflectCharts.jsx';
import ReflectDeepAnalysis from '@/components/reflect/ReflectDeepAnalysis.jsx';
import ReflectInsightCard from '@/components/reflect/ReflectInsightCard.jsx';

import {
  useAccounts,
  useAllTransactions,
  useBudgetSummary,
  useCategories,
  useSavingsGoals,
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

const safeNumber = (value) => Number(value || 0);

const clampPercent = (value) =>
  Math.max(0, Math.min(Number.isFinite(Number(value)) ? Number(value) : 0, 100));

const formatPercent = (value) => `${Math.round(safeNumber(value))}%`;

function MoneyMetric({ amount, currency, signed = false }) {
  const value = safeNumber(amount);
  const sign = signed && value > 0 ? '+' : signed && value < 0 ? '-' : '';

  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
      {sign && <span>{sign}</span>}
      <CurrencyAmount amount={Math.abs(value)} currency={currency} compact />
    </span>
  );
}

function MoneyText({ amount, currency, signed = false }) {
  return (
    <InlineMoney>
      <MoneyMetric amount={amount} currency={currency} signed={signed} />
    </InlineMoney>
  );
}

function getPeriodProgress(selectedYear, selectedMonth, isYear) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const yearNumber = Number(selectedYear || currentYear);

  if (isYear) {
    if (yearNumber < currentYear) return 100;
    if (yearNumber > currentYear) return 0;

    return clampPercent((currentMonth / 12) * 100);
  }

  const monthNumber = Number(selectedMonth || currentMonth);
  const selectedPeriodIndex = yearNumber * 12 + monthNumber;
  const currentPeriodIndex = currentYear * 12 + currentMonth;
  const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();

  if (selectedPeriodIndex < currentPeriodIndex) return 100;
  if (selectedPeriodIndex > currentPeriodIndex) return 0;

  return clampPercent((now.getDate() / daysInMonth) * 100);
}

function getToneFromSavingsRate(rate) {
  if (rate >= 20) return 'good';
  if (rate >= 5) return 'warning';
  return rate < 0 ? 'bad' : 'warning';
}

function getBudgetTone(usedPercent, progressPercent, hasPlan) {
  if (!hasPlan) return 'info';
  if (usedPercent <= progressPercent + 5) return 'good';
  if (usedPercent <= progressPercent + 15) return 'warning';
  return 'bad';
}

function buildReflectInsights({
  isYear,
  selectedYear,
  selectedMonth,
  currency,
  income,
  expenses,
  trackedSavings,
  trackedDebt,
  plannedExpenses,
  totalPlannedOutflow,
  totalTrackedOutflow,
  netCashFlow,
  savingsRate,
  efficiency,
  topCategory,
}) {
  const periodName = isYear ? 'year' : 'month';
  const periodLabel = isYear ? 'Yearly' : 'Monthly';
  const progressPercent = getPeriodProgress(selectedYear, selectedMonth, isYear);
  const hasIncome = income > 0;
  const cashFlowPositive = netCashFlow >= 0;
  const topCategoryPercent =
    topCategory && expenses > 0
      ? Math.round((safeNumber(topCategory.value) / expenses) * 100)
      : 0;

  const monthlyBudgetUsedPercent =
    plannedExpenses > 0 ? clampPercent((expenses / plannedExpenses) * 100) : 0;

  const yearlyPlanUsedPercent =
    totalPlannedOutflow > 0
      ? clampPercent((totalTrackedOutflow / totalPlannedOutflow) * 100)
      : 0;

  const monthlyBudgetRemaining = plannedExpenses - expenses;
  const yearlyPlanRemaining = totalPlannedOutflow - totalTrackedOutflow;

  const budgetTone = isYear
    ? getBudgetTone(yearlyPlanUsedPercent, progressPercent, totalPlannedOutflow > 0)
    : getBudgetTone(monthlyBudgetUsedPercent, progressPercent, plannedExpenses > 0);

  return [
    {
      icon: cashFlowPositive ? TrendingUp : TrendingDown,
      title: `${periodLabel} Cash Flow`,
      metric: <MoneyMetric amount={netCashFlow} currency={currency} signed />,
      text: cashFlowPositive ? (
        <>
          Income was higher than expenses by{' '}
          <MoneyText amount={netCashFlow} currency={currency} /> this {periodName},
          so the period ended with positive net cash flow.
        </>
      ) : (
        <>
          Expenses were higher than income by{' '}
          <MoneyText amount={Math.abs(netCashFlow)} currency={currency} /> this{' '}
          {periodName}, so review the largest spending areas.
        </>
      ),
      tone: cashFlowPositive ? 'good' : 'bad',
    },
    isYear
      ? {
          icon: Wallet,
          title: 'Yearly Plan Pace',
          metric:
            totalPlannedOutflow > 0
              ? `${Math.round(yearlyPlanUsedPercent)}% used`
              : 'No plan',
          text:
            totalPlannedOutflow > 0 ? (
              <>
                You have tracked{' '}
                <MoneyText amount={totalTrackedOutflow} currency={currency} /> from
                a planned yearly outflow of{' '}
                <MoneyText amount={totalPlannedOutflow} currency={currency} />.
              </>
            ) : (
              'Add yearly or monthly plans first, then Reflect can compare actual usage against your full-year target.'
            ),
          tone: budgetTone,
        }
      : {
          icon: monthlyBudgetRemaining >= 0 ? Wallet : AlertTriangle,
          title: 'Monthly Expense Plan',
          metric:
            plannedExpenses > 0 ? (
              monthlyBudgetRemaining >= 0 ? (
                <MoneyMetric amount={monthlyBudgetRemaining} currency={currency} />
              ) : (
                'Over'
              )
            ) : (
              'No plan'
            ),
          text:
            plannedExpenses > 0 ? (
              monthlyBudgetRemaining >= 0 ? (
                <>
                  You still have{' '}
                  <MoneyText amount={monthlyBudgetRemaining} currency={currency} />{' '}
                  left from the planned expense budget of{' '}
                  <MoneyText amount={plannedExpenses} currency={currency} />.
                </>
              ) : (
                <>
                  Expenses are over the planned budget by{' '}
                  <MoneyText
                    amount={Math.abs(monthlyBudgetRemaining)}
                    currency={currency}
                  />
                  , so optional spending needs attention.
                </>
              )
            ) : (
              'Add an expense plan for this month to measure budget pace and remaining spending room.'
            ),
          tone: monthlyBudgetRemaining < 0 ? 'bad' : budgetTone,
        },
    {
      icon: topCategory ? CreditCard : Brain,
      title: topCategory ? 'Largest Spending Category' : 'No Spending Yet',
      metric: topCategory ? (
        <MoneyMetric amount={topCategory.value} currency={currency} />
      ) : (
        '0'
      ),
      text: topCategory ? (
        <>
          {topCategory.name} is the largest category, using {topCategoryPercent}% of
          total expenses this {periodName}.
        </>
      ) : (
        `No expense category has been recorded for this ${periodName} yet; category insights will appear after transactions are added.`
      ),
      tone:
        topCategoryPercent >= 50
          ? 'warning'
          : topCategoryPercent >= 35
            ? 'info'
            : topCategory
              ? 'default'
              : 'good',
    },
    {
      icon: PiggyBank,
      title: `${periodLabel} Savings / Debt Rate`,
      metric: hasIncome ? formatPercent(savingsRate) : 'No income',
      text: hasIncome ? (
        isYear ? (
          <>
            Your savings/debt rate is {formatPercent(savingsRate)}; this includes{' '}
            <MoneyText amount={trackedSavings} currency={currency} /> saved and{' '}
            <MoneyText amount={trackedDebt} currency={currency} /> paid toward debt.
          </>
        ) : (
          <>
            Your savings/debt rate is {formatPercent(savingsRate)} with{' '}
            <MoneyText amount={trackedSavings} currency={currency} /> saved and{' '}
            <MoneyText amount={trackedDebt} currency={currency} /> paid toward debt
            this month.
          </>
        )
      ) : (
        `Add income transactions to calculate the ${periodName} savings/debt rate and cash-flow margin.`
      ),
      tone: hasIncome ? getToneFromSavingsRate(savingsRate) : 'info',
    },
    {
      icon: isYear ? BarChart3 : AlertTriangle,
      title: isYear ? 'Year Progress Check' : 'Budget Pace Check',
      metric: isYear
        ? `${Math.round(progressPercent)}% passed`
        : efficiency == null
          ? `${Math.round(progressPercent)}% passed`
          : `${Math.round(efficiency)}% score`,
      text: isYear ? (
        totalPlannedOutflow > 0 ? (
          <>
            The year is {Math.round(progressPercent)}% complete and plan usage is{' '}
            {Math.round(yearlyPlanUsedPercent)}%; remaining planned room is{' '}
            <MoneyText amount={yearlyPlanRemaining} currency={currency} />.
          </>
        ) : (
          'Year progress is visible now; add plan data to compare yearly time passed against planned usage.'
        )
      ) : plannedExpenses > 0 ? (
        <>
          The month is {Math.round(progressPercent)}% complete while expense usage is{' '}
          {Math.round(monthlyBudgetUsedPercent)}%, showing whether spending pace is
          comfortable or tight.
        </>
      ) : (
        'Monthly pace tracking starts after adding an expense plan for the selected month.'
      ),
      tone: isYear ? budgetTone : plannedExpenses > 0 ? budgetTone : 'info',
    },
  ];
}

function isGoalTransfer(transaction) {
  return Boolean(
    transaction?.savings_goal_id ||
      transaction?.goal_id ||
      transaction?.goal_contribution_id ||
      transaction?.source_type === 'goal' ||
      transaction?.source_type === 'savings_goal'
  );
}

function getTransactionPeriodKey(transaction) {
  const value =
    transaction?.date ||
    transaction?.transaction_date ||
    transaction?.created_at ||
    transaction?.posted_at;

  if (!value) return '';

  return String(value).slice(0, 7);
}

function getTransactionYear(transaction) {
  const value =
    transaction?.date ||
    transaction?.transaction_date ||
    transaction?.created_at ||
    transaction?.posted_at;

  if (!value) return '';

  return String(value).slice(0, 4);
}

export default function DashboardReflect() {
  const today = new Date();

  const [selectedYear, setSelectedYear] = useState(format(today, 'yyyy'));
  const [selectedMonth, setSelectedMonth] = useState(format(today, 'MM'));
  const [periodMode, setPeriodMode] = useState('month');

  const currency = useCurrency();

  const { data: categories = [] } = useCategories();
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: settings = {} } = useUserSettings();
  const { data: savingsGoals = [] } = useSavingsGoals();

  const isYearView = periodMode === 'year';
  const analysisMonth = isYearView ? 'all' : selectedMonth;

  const currentMonthKey = isYearView
    ? null
    : `${selectedYear}-${selectedMonth}`;

  const monthBudget = useBudgetSummary(currentMonthKey);
  const yearBudget = useYearBudgetSummary(selectedYear);

  const analysis = useReflectAnalysis({
    selectedYear,
    selectedMonth: analysisMonth,
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
    periodTransactions,
  } = analysis;

  const goalTransactions = useMemo(() => {
    const safeTransactions = Array.isArray(periodTransactions)
      ? periodTransactions
      : [];

    return safeTransactions.filter(
      (transaction) => transaction?.type === 'transfer' && isGoalTransfer(transaction)
    );
  }, [periodTransactions]);

  const insights = useMemo(
    () =>
      buildReflectInsights({
        isYear,
        selectedYear,
        selectedMonth: analysisMonth,
        currency,
        income,
        expenses,
        trackedSavings,
        trackedDebt,
        plannedExpenses,
        totalPlannedOutflow,
        totalTrackedOutflow,
        netCashFlow,
        savingsRate,
        efficiency,
        topCategory,
      }),
    [
      isYear,
      selectedYear,
      analysisMonth,
      currency,
      income,
      expenses,
      trackedSavings,
      trackedDebt,
      plannedExpenses,
      totalPlannedOutflow,
      totalTrackedOutflow,
      netCashFlow,
      savingsRate,
      efficiency,
      topCategory,
    ]
  );

  return (
    <>
      <div className="animate-child">
        <ReflectPeriodSelector
          year={selectedYear}
          month={analysisMonth}
          periodMode={periodMode}
          onPeriodModeChange={setPeriodMode}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
        />
      </div>

      <div className="animate-child">
        <ReflectSummaryCards
          isYear={isYear}
          selectedYear={selectedYear}
          selectedMonth={analysisMonth}
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
      </div>

      <div className="animate-child">
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
      </div>

      <div className="animate-child">
        <ReflectDeepAnalysis
          isYear={isYear}
          selectedYear={selectedYear}
          selectedMonth={isYear ? selectedMonth : analysisMonth}
          goals={savingsGoals}
          goalTransactions={goalTransactions}
          currency={currency}
        />
      </div>

      <div className="animate-child">
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((insight) => (
            <ReflectInsightCard
              key={`${isYear ? 'year' : 'month'}-${insight.title}`}
              icon={insight.icon}
              title={insight.title}
              text={insight.text}
              tone={insight.tone}
              metric={insight.metric}
            />
          ))}
        </div>
      </div>
    </>
  );
}