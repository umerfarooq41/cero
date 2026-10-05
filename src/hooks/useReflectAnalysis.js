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


function getGoalTransactionId(transaction) {
  return transaction?.savings_goal_id || transaction?.goal_id || null;
}

function isGoalTransfer(transaction) {
  return Boolean(
    transaction?.type === 'transfer' &&
      (getGoalTransactionId(transaction) || transaction?.goal_contribution_id)
  );
}

function getAccountsById(accounts = []) {
  return new Map(accounts.map((account) => [account.id, account]));
}

function isDebtTransfer(transaction, accountsById) {
  if (transaction?.type !== 'transfer') return false;
  if (isGoalTransfer(transaction)) return false;

  const destinationAccount = accountsById.get(transaction?.to_account_id);
  const destinationCategory = String(destinationAccount?.category || '').toLowerCase();
  const destinationType = String(destinationAccount?.type || '').toLowerCase();

  return (
    destinationCategory === 'liability' ||
    ['loan', 'credit_card', 'debt'].includes(destinationType)
  );
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

function getMonthTotals(
  allTransactions,
  month,
  settings,
  categories = [],
  accountsById = new Map()
) {
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

  const savings = txns
    .filter((transaction) => {
      if (isGoalTransfer(transaction)) return true;
      return getCategoryType(categories, transaction.category_id) === 'savings';
    })
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  const debt = txns
    .filter((transaction) => {
      if (isDebtTransfer(transaction, accountsById)) return true;
      return getCategoryType(categories, transaction.category_id) === 'debt';
    })
    .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

  const totalOutflow = expenses + savings + debt;

  return {
    income,
    expenses,
    savings,
    debt,
    totalOutflow,
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

function getQuarterTotals(
  allTransactions,
  selectedYear,
  quarter,
  settings,
  categories = [],
  accountsById = new Map()
) {
  return quarter.months.reduce(
    (sum, month) => {
      const monthTotals = getMonthTotals(
        allTransactions,
        `${selectedYear}-${month}`,
        settings,
        categories,
        accountsById
      );

      return {
        income: sum.income + monthTotals.income,
        expenses: sum.expenses + monthTotals.expenses,
        savings: sum.savings + monthTotals.savings,
        debt: sum.debt + monthTotals.debt,
        totalOutflow: sum.totalOutflow + monthTotals.totalOutflow,
        net: sum.net + monthTotals.net,
      };
    },
    { income: 0, expenses: 0, savings: 0, debt: 0, totalOutflow: 0, net: 0 }
  );
}

export default function useReflectAnalysis({
  selectedYear,
  selectedMonth,
  allTransactions = [],
  periodTransactions: suppliedPeriodTransactions,
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
    if (!isYear && Array.isArray(suppliedPeriodTransactions)) {
      return suppliedPeriodTransactions;
    }

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
  }, [
    allTransactions,
    isYear,
    selectedYear,
    monthKey,
    settings,
    suppliedPeriodTransactions,
  ]);

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

  const accountsById = useMemo(() => getAccountsById(accounts), [accounts]);

  const trackedSavings = useMemo(() => {
    return periodTransactions
      .filter((transaction) => {
        if (isGoalTransfer(transaction)) return true;
        return getCategoryType(categories, transaction.category_id) === 'savings';
      })
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
  }, [periodTransactions, categories]);

  const trackedDebt = useMemo(() => {
    return periodTransactions
      .filter((transaction) => {
        if (isDebtTransfer(transaction, accountsById)) return true;
        return getCategoryType(categories, transaction.category_id) === 'debt';
      })
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
  }, [periodTransactions, categories, accountsById]);

  const plannedExpenses = Number(budget?.totalPlannedExpenses) || 0;
  const plannedIncome = Number(budget?.totalPlannedIncome) || 0;
  const plannedSavings = Number(budget?.totalPlannedSavings) || 0;
  const plannedDebt = Number(budget?.totalPlannedDebt) || 0;
  const leftToAllocate = isYear ? 0 : Number(budget?.leftToAllocate) || 0;

  const totalPlannedOutflow = plannedExpenses + plannedSavings + plannedDebt;
  const totalTrackedOutflow = expenses + trackedSavings + trackedDebt;

  // Cash flow is operating cash flow only: income minus actual expenses.
  // Savings transfers, debt payments, and normal transfers are allocations/movement,
  // so they stay out of cash-flow math and remain tracked separately.
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

  const cashFlowRate = income > 0 ? Math.round((netCashFlow / income) * 100) : 0;
  const savingsDebtRate =
    income > 0 ? Math.round(((trackedSavings + trackedDebt) / income) * 100) : 0;

  // Keep the old property name for existing Reflect components, but make it
  // represent actual savings/debt allocations instead of net cash flow.
  const savingsRate = savingsDebtRate;

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

  const cashFlow = useMemo(() => {
    if (isYear) {
      return QUARTERS.map((quarter) => {
        const totals = getQuarterTotals(
          allTransactions,
          selectedYear,
          quarter,
          settings,
          categories,
          accountsById
        );

        return {
          month: quarter.label,
          income: totals.income,
          expenses: totals.expenses,
          net: totals.net,
        };
      });
    }

    return getRollingMonthKeys(monthKey, 3).map(({ key, label }) => {
      const totals = getMonthTotals(
        allTransactions,
        key,
        settings,
        categories,
        accountsById
      );

      return {
        month: label,
        income: totals.income,
        expenses: totals.expenses,
        net: totals.net,
      };
    });
  }, [isYear, selectedYear, monthKey, allTransactions, settings, categories, accountsById]);

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
    savingsDebtRate,
    cashFlowRate,
    efficiency,
    spendingBreakdown,
    cashFlow,
    spendingTrend,
    topCategory: spendingBreakdown[0],
  };
}