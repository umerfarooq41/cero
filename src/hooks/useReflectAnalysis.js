import { useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import {
  filterTransactionsByBudgetMonth,
  filterTransactionsByBudgetYear,
} from '@/lib/budgetLogic';

export const CHART_COLORS = [
  '#0078D4',
  '#107C10',
  '#C50F1F',
  '#8764B8',
  '#CA5010',
  '#008272',
  '#4F6BED',
  '#FFB900',
];

export const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const QUARTERS = [
  { label: 'Q1', months: ['01', '02', '03'] },
  { label: 'Q2', months: ['04', '05', '06'] },
  { label: 'Q3', months: ['07', '08', '09'] },
  { label: 'Q4', months: ['10', '11', '12'] },
];

export function getPeriodRange(year, month) {
  if (month === 'all') {
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
      monthKey: `${year}-01`,
      isYear: true,
    };
  }

  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-31`,
    monthKey: `${year}-${month}`,
    isYear: false,
  };
}

function getCategoryType(categories, categoryId) {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return null;

  if (category.type) return category.type;

  const parent = categories.find((item) => item.id === category.parent_id);
  return parent?.type || null;
}

function getMonthTotals(allTransactions, month, settings) {
  const txns = filterTransactionsByBudgetMonth(
    allTransactions,
    month,
    settings
  );

  const income = txns
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  const expenses = txns
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  return {
    income,
    expenses,
    net: income - expenses,
  };
}

function getRollingMonthKeys(monthKey, count = 3) {
  const [year, month] = monthKey.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, 1);

  return Array.from({ length: count }, (_, index) => {
    const monthDate = subMonths(selectedDate, count - 1 - index);

    return {
      key: format(monthDate, 'yyyy-MM'),
      label: format(monthDate, 'MMM'),
    };
  });
}

function getQuarterTotals(allTransactions, selectedYear, quarter, settings) {
  return quarter.months.reduce(
    (sum, month) => {
      const monthTotals = getMonthTotals(
        allTransactions,
        `${selectedYear}-${month}`,
        settings
      );

      return {
        income: sum.income + monthTotals.income,
        expenses: sum.expenses + monthTotals.expenses,
      };
    },
    { income: 0, expenses: 0 }
  );
}

export default function useReflectAnalysis({
  selectedYear,
  selectedMonth,
  allTransactions = [],
  accounts = [],
  categories = [],
  budget,
  settings = {},
}) {
  const { start, end, monthKey, isYear } = useMemo(
    () => getPeriodRange(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const periodTransactions = useMemo(() => {
    if (isYear) {
      return filterTransactionsByBudgetYear(
        allTransactions,
        selectedYear,
        settings
      );
    }

    return filterTransactionsByBudgetMonth(
      allTransactions,
      monthKey,
      settings
    );
  }, [allTransactions, isYear, selectedYear, monthKey, settings]);

  const income = useMemo(() => {
    return periodTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
  }, [periodTransactions]);

  const expenses = useMemo(() => {
    return periodTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
  }, [periodTransactions]);

  const trackedSavings = useMemo(() => {
    return periodTransactions
      .filter(
        (transaction) =>
          getCategoryType(categories, transaction.category_id) === 'savings'
      )
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
  }, [periodTransactions, categories]);

  const trackedDebt = useMemo(() => {
    return periodTransactions
      .filter(
        (transaction) =>
          getCategoryType(categories, transaction.category_id) === 'debt'
      )
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
  }, [periodTransactions, categories]);

  const plannedExpenses = Number(budget?.totalPlannedExpenses) || 0;
  const plannedIncome = Number(budget?.totalPlannedIncome) || 0;
  const plannedSavings = Number(budget?.totalPlannedSavings) || 0;
  const plannedDebt = Number(budget?.totalPlannedDebt) || 0;
  const leftToAllocate = isYear ? 0 : Number(budget?.leftToAllocate) || 0;

  const totalPlannedOutflow = plannedExpenses + plannedSavings + plannedDebt;
  const totalTrackedOutflow = expenses + trackedSavings + trackedDebt;

  const netCashFlow = income - expenses;

  const netWorth = useMemo(() => {
    return accounts.reduce((sum, account) => {
      const balance = Number(account.balance) || 0;
      return sum + (account.category === 'asset' ? balance : -Math.abs(balance));
    }, 0);
  }, [accounts]);

  const totalAssets = useMemo(() => {
    return accounts
      .filter((account) => account.category === 'asset')
      .reduce((sum, account) => sum + (Number(account.balance) || 0), 0);
  }, [accounts]);

  const totalLiabilities = useMemo(() => {
    return accounts
      .filter((account) => account.category === 'liability')
      .reduce((sum, account) => sum + Math.abs(Number(account.balance) || 0), 0);
  }, [accounts]);

  const savingsRate = income > 0 ? Math.round((netCashFlow / income) * 100) : 0;

  const efficiency = useMemo(() => {
    if (isYear || plannedExpenses === 0) return null;

    const ratio = expenses / plannedExpenses;

    if (ratio <= 1) {
      return Math.round((1 - Math.abs(1 - ratio)) * 100);
    }

    return Math.max(0, Math.round((1 - (ratio - 1)) * 100));
  }, [isYear, expenses, plannedExpenses]);

  const spendingBreakdown = useMemo(() => {
    const categorySpending = {};

    periodTransactions
      .filter((transaction) => transaction.type === 'expense')
      .forEach((transaction) => {
        const category = categories.find(
          (item) => item.id === transaction.category_id
        );

        const name = category?.name || 'Uncategorized';

        categorySpending[name] =
          (categorySpending[name] || 0) + (Number(transaction.amount) || 0);
      });

    return Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));
  }, [periodTransactions, categories]);

  const cashFlow = useMemo(() => {
    if (isYear) {
      return QUARTERS.map((quarter) => {
        const totals = getQuarterTotals(
          allTransactions,
          selectedYear,
          quarter,
          settings
        );

        return {
          month: quarter.label,
          income: totals.income,
          expenses: totals.expenses,
          net: totals.income - totals.expenses,
        };
      });
    }

    return getRollingMonthKeys(monthKey, 3).map(({ key, label }) => {
      const totals = getMonthTotals(allTransactions, key, settings);

      return {
        month: label,
        income: totals.income,
        expenses: totals.expenses,
        net: totals.net,
      };
    });
  }, [isYear, selectedYear, monthKey, allTransactions, settings]);

  const spendingTrend = useMemo(() => {
    if (isYear) {
      return MONTH_LABELS.map((label, index) => {
        const month = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;

        const amount = allTransactions
          .filter((transaction) => transaction.type === 'expense')
          .filter(
            (transaction) =>
              filterTransactionsByBudgetMonth(
                [transaction],
                month,
                settings
              ).length > 0
          )
          .reduce(
            (sum, transaction) => sum + (Number(transaction.amount) || 0),
            0
          );

        return { label, amount };
      });
    }

    const days = {};

    periodTransactions
      .filter((transaction) => transaction.type === 'expense')
      .forEach((transaction) => {
        const day = transaction.date?.slice(8, 10) || '01';
        days[day] = (days[day] || 0) + (Number(transaction.amount) || 0);
      });

    return Object.entries(days)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([day, amount]) => ({ label: day, amount }));
  }, [isYear, selectedYear, allTransactions, periodTransactions, settings]);

  return {
    start,
    end,
    monthKey,
    isYear,
    periodTransactions,
    income,
    expenses,
    trackedSavings,
    trackedDebt,
    plannedExpenses,
    plannedIncome,
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
    topCategory: spendingBreakdown[0],
  };
}