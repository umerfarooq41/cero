import { useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import {
  filterTransactionsByBudgetMonth,
  filterTransactionsByBudgetYear,
} from '@/lib/budgetLogic';

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

function getCategoryColor(categories, categoryId) {
  const category = categories.find((item) => item.id === categoryId);

  if (!category) {
    return 'hsl(var(--muted-foreground))';
  }

  const parent = category.parent_id
    ? categories.find((item) => item.id === category.parent_id)
    : null;

  return (
    category.color ||
    category.colour ||
    category.hex_color ||
    parent?.color ||
    parent?.colour ||
    parent?.hex_color ||
    'hsl(var(--muted-foreground))'
  );
}

function getCategoryName(categories, categoryId) {
  const category = categories.find((item) => item.id === categoryId);
  return category?.name || 'Uncategorized';
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

function getCategoryById(categories, categoryId) {
  return categories.find((item) => item.id === categoryId) || null;
}

function getComparablePeriodKey({ selectedYear, selectedMonth, isYear }) {
  if (isYear) {
    return {
      label: String(Number(selectedYear) - 1),
      year: String(Number(selectedYear) - 1),
      monthKey: null,
    };
  }

  const [year, month] = String(`${selectedYear}-${selectedMonth}`).split('-').map(Number);
  const date = new Date(year, month - 2, 1);

  return {
    label: format(date, 'MMM yyyy'),
    year: format(date, 'yyyy'),
    monthKey: format(date, 'yyyy-MM'),
  };
}

function getTransactionsForComparablePeriod({
  allTransactions,
  selectedYear,
  selectedMonth,
  isYear,
  settings,
}) {
  const comparable = getComparablePeriodKey({ selectedYear, selectedMonth, isYear });

  if (isYear) {
    return filterTransactionsByBudgetYear(
      allTransactions,
      comparable.year,
      settings
    );
  }

  return filterTransactionsByBudgetMonth(
    allTransactions,
    comparable.monthKey,
    settings
  );
}

function buildCategoryTotals(transactions, categories, { expenseOnly = false } = {}) {
  const totals = {};

  transactions.forEach((transaction) => {
    const type = transaction.type;
    const categoryId = transaction.category_id || 'uncategorized';
    const category = getCategoryById(categories, categoryId);
    const resolvedType = category ? getCategoryType(categories, categoryId) : type;

    if (expenseOnly && type !== 'expense') return;

    // Ordinary account-to-account transfers do not belong in budget variance.
    // Savings/debt transfers stay visible because they represent planned allocations.
    if (type === 'transfer' && !['savings', 'debt'].includes(resolvedType)) {
      return;
    }

    const name = category?.name || 'Uncategorized';
    const amount = Number(transaction.amount) || 0;

    if (!totals[categoryId]) {
      totals[categoryId] = {
        id: categoryId,
        name,
        type: resolvedType || type || 'other',
        color: getCategoryColor(categories, categoryId),
        amount: 0,
      };
    }

    totals[categoryId].amount += amount;
  });

  return totals;
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
        const categoryId = transaction.category_id;
        const name = getCategoryName(categories, categoryId);
        const color = getCategoryColor(categories, categoryId);
        const amount = Number(transaction.amount) || 0;

        if (!categorySpending[name]) {
          categorySpending[name] = {
            name,
            value: 0,
            color,
          };
        }

        categorySpending[name].value += amount;
      });

    return Object.values(categorySpending).sort((a, b) => b.value - a.value);
  }, [periodTransactions, categories]);

  const budgetVsActual = useMemo(() => {
    const plannedByCategory = {};
    const actualByCategory = buildCategoryTotals(periodTransactions, categories);

    (budget?.allocations || []).forEach((allocation) => {
      const categoryId = allocation.category_id;
      if (!categoryId) return;

      const category = getCategoryById(categories, categoryId);
      const type = getCategoryType(categories, categoryId);

      if (!plannedByCategory[categoryId]) {
        plannedByCategory[categoryId] = {
          id: categoryId,
          name: category?.name || 'Uncategorized',
          type: type || 'other',
          color: getCategoryColor(categories, categoryId),
          planned: 0,
        };
      }

      plannedByCategory[categoryId].planned += Number(allocation.planned_amount) || 0;
    });

    const categoryIds = new Set([
      ...Object.keys(plannedByCategory),
      ...Object.keys(actualByCategory),
    ]);

    return Array.from(categoryIds)
      .map((categoryId) => {
        const plannedRow = plannedByCategory[categoryId];
        const actualRow = actualByCategory[categoryId];
        const planned = Number(plannedRow?.planned || 0);
        const actual = Number(actualRow?.amount || 0);
        const variance = planned - actual;
        const usedPercent = planned > 0 ? (actual / planned) * 100 : actual > 0 ? 100 : 0;
        const type = plannedRow?.type || actualRow?.type || 'other';

        return {
          id: categoryId,
          name: plannedRow?.name || actualRow?.name || 'Uncategorized',
          type,
          color: plannedRow?.color || actualRow?.color || 'hsl(var(--muted-foreground))',
          planned,
          actual,
          variance,
          usedPercent,
          isOver: planned > 0 && actual > planned,
        };
      })
      .filter((row) => row.planned > 0 || row.actual > 0)
      .sort((a, b) => {
        const typeRank = { expense: 0, savings: 1, debt: 2, income: 3 };
        const rankDiff = (typeRank[a.type] ?? 9) - (typeRank[b.type] ?? 9);
        if (rankDiff !== 0) return rankDiff;

        return Math.abs(b.variance) - Math.abs(a.variance);
      });
  }, [budget?.allocations, periodTransactions, categories]);

  const categoryTrends = useMemo(() => {
    const previousTransactions = getTransactionsForComparablePeriod({
      allTransactions,
      selectedYear,
      selectedMonth,
      isYear,
      settings,
    });

    const currentTotals = buildCategoryTotals(periodTransactions, categories, {
      expenseOnly: true,
    });

    const previousTotals = buildCategoryTotals(previousTransactions, categories, {
      expenseOnly: true,
    });

    const categoryIds = new Set([
      ...Object.keys(currentTotals),
      ...Object.keys(previousTotals),
    ]);

    return Array.from(categoryIds)
      .map((categoryId) => {
        const current = currentTotals[categoryId];
        const previous = previousTotals[categoryId];
        const currentAmount = Number(current?.amount || 0);
        const previousAmount = Number(previous?.amount || 0);
        const change = currentAmount - previousAmount;
        const changePercent =
          previousAmount > 0
            ? (change / previousAmount) * 100
            : currentAmount > 0
              ? 100
              : 0;

        return {
          id: categoryId,
          name: current?.name || previous?.name || 'Uncategorized',
          color: current?.color || previous?.color || 'hsl(var(--muted-foreground))',
          current: currentAmount,
          previous: previousAmount,
          change,
          changePercent,
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
        };
      })
      .filter((row) => row.current > 0 || row.previous > 0)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [
    allTransactions,
    periodTransactions,
    categories,
    selectedYear,
    selectedMonth,
    isYear,
    settings,
  ]);

  const comparablePeriodLabel = useMemo(() => {
    return getComparablePeriodKey({
      selectedYear,
      selectedMonth,
      isYear,
    }).label;
  }, [selectedYear, selectedMonth, isYear]);

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
    budgetVsActual,
    categoryTrends,
    comparablePeriodLabel,
    cashFlow,
    spendingTrend,
    topCategory: spendingBreakdown[0],
  };
}