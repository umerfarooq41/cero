import { useMemo } from 'react';
import { format, subMonths } from 'date-fns';

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

export default function useReflectAnalysis({
  selectedYear,
  selectedMonth,
  allTransactions = [],
  accounts = [],
  categories = [],
  budget,
}) {
  const { start, end, monthKey, isYear } = useMemo(
    () => getPeriodRange(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const periodTransactions = useMemo(() => {
    return allTransactions.filter((transaction) => {
      if (!transaction.date) return false;
      return transaction.date >= start && transaction.date <= end;
    });
  }, [allTransactions, start, end]);

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

  const plannedExpenses = isYear ? 0 : Number(budget?.totalPlannedExpenses) || 0;
  const plannedIncome = isYear ? 0 : Number(budget?.totalPlannedIncome) || 0;
  const leftToAllocate = isYear ? 0 : Number(budget?.leftToAllocate) || 0;
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
    const months = [];

    if (isYear) {
      for (let index = 0; index < 12; index += 1) {
        const month = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;

        const txns = allTransactions.filter((transaction) =>
          transaction.date?.startsWith(month)
        );

        const monthIncome = txns
          .filter((transaction) => transaction.type === 'income')
          .reduce(
            (sum, transaction) => sum + (Number(transaction.amount) || 0),
            0
          );

        const monthExpenses = txns
          .filter((transaction) => transaction.type === 'expense')
          .reduce(
            (sum, transaction) => sum + (Number(transaction.amount) || 0),
            0
          );

        months.push({
          month: MONTH_LABELS[index],
          income: monthIncome,
          expenses: monthExpenses,
          net: monthIncome - monthExpenses,
        });
      }

      return months;
    }

    for (let index = 5; index >= 0; index -= 1) {
      const monthDate = subMonths(new Date(`${monthKey}-01`), index);
      const month = format(monthDate, 'yyyy-MM');
      const label = format(monthDate, 'MMM');

      const txns = allTransactions.filter((transaction) =>
        transaction.date?.startsWith(month)
      );

      const monthIncome = txns
        .filter((transaction) => transaction.type === 'income')
        .reduce(
          (sum, transaction) => sum + (Number(transaction.amount) || 0),
          0
        );

      const monthExpenses = txns
        .filter((transaction) => transaction.type === 'expense')
        .reduce(
          (sum, transaction) => sum + (Number(transaction.amount) || 0),
          0
        );

      months.push({
        month: label,
        income: monthIncome,
        expenses: monthExpenses,
        net: monthIncome - monthExpenses,
      });
    }

    return months;
  }, [isYear, selectedYear, monthKey, allTransactions]);

  const spendingTrend = useMemo(() => {
    if (isYear) {
      return MONTH_LABELS.map((label, index) => {
        const month = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;

        const amount = allTransactions
          .filter(
            (transaction) =>
              transaction.type === 'expense' &&
              transaction.date?.startsWith(month)
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
  }, [isYear, selectedYear, allTransactions, periodTransactions]);

  return {
    start,
    end,
    monthKey,
    isYear,
    periodTransactions,
    income,
    expenses,
    plannedExpenses,
    plannedIncome,
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
