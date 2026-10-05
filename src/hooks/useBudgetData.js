import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  accountsApi,
  budgetPlansApi,
  categoriesApi,
  recurringTransactionsApi,
  savingsGoalsApi,
  goalContributionsApi,
  transactionsApi,
  getUserSettings,
} from '@/lib/budgetData';
import {
  buildPlanTotals,
  calculateLeftToAllocateFromTotals,
  isGoalFundUseTransaction,
} from '@/lib/planData';
import {
  calculateAutoSweepSurplus,
  filterTransactionsByBudgetMonth,
  filterTransactionsByBudgetYear,
  findAutoSweepTargets,
  getAutoSweepMarker,
  getBudgetMonthCloseDate,
  getCurrentBudgetMonth,
  getPreviousBudgetMonth,
  isTwentyFifthRuleEnabled,
  hasAutoSweepForMonth,
  isAutoSweepSurplusEnabled,
} from '@/lib/budgetLogic';
import { useAuth } from '@/lib/AuthContext';

export function useCategories() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['categories', session?.user?.id],
    queryFn: async () => {
      const categories = await categoriesApi.list();
      return categories.filter(c => !c.is_archived);
    },
    enabled: Boolean(session?.user?.id),
    initialData: [],
  });
}

export function useAccounts() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['accounts', session?.user?.id],
    queryFn: async () => {
      const accounts = await accountsApi.list();
      return accounts.filter(a => !a.is_archived);
    },
    enabled: Boolean(session?.user?.id),
    initialData: [],
  });
}

function normalizeUserSettings(settings = {}) {
  return {
    ...settings,
    budgetLogic: {
      twentyFifthRule:
        settings?.budgetLogic?.twentyFifthRule ??
        settings?.budget_logic?.twenty_fifth_rule ??
        settings?.twentyFifthRule ??
        settings?.shift25th ??
        false,
      autoSweepSurplus:
        settings?.budgetLogic?.autoSweepSurplus ??
        settings?.budget_logic?.auto_sweep_surplus ??
        settings?.autoSweepSurplus ??
        settings?.auto_sweep ??
        false,
    },
  };
}

export function useUserSettings() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['user-settings', session?.user?.id],
    queryFn: async () => {
      const settings = await getUserSettings();
      return normalizeUserSettings(settings || {});
    },
    enabled: Boolean(session?.user?.id),
    initialData: normalizeUserSettings(),
  });
}

function getCalendarMonthDateRange(month) {
  const [year, monthNumber] = String(month || '').split('-').map(Number);

  if (!year || !monthNumber || monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  const lastDay = new Date(year, monthNumber, 0).getDate();

  return {
    startDate: `${year}-${String(monthNumber).padStart(2, '0')}-01`,
    endDate: `${year}-${String(monthNumber).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

function getBudgetMonthDateRange(month, settings = {}) {
  const calendarRange = getCalendarMonthDateRange(month);
  if (!calendarRange || !isTwentyFifthRuleEnabled(settings)) {
    return calendarRange;
  }

  const previousMonth = getPreviousBudgetMonth(month);
  const previousRange = getCalendarMonthDateRange(previousMonth);

  return {
    startDate: `${previousMonth}-25`,
    endDate: `${month}-24`,
  };
}

export function useTransactions(month) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['transactions', session?.user?.id, month],
    queryFn: async () => {
      const settings = await getUserSettings();
      const range = getBudgetMonthDateRange(
        month,
        normalizeUserSettings(settings || {})
      );

      if (!range) return [];

      return transactionsApi.listByDateRange(range.startDate, range.endDate);
    },
    enabled: Boolean(session?.user?.id && month),
    initialData: [],
  });
}

export function useTransactionsForMonths(months = []) {
  const { session } = useAuth();
  const monthKey = months.filter(Boolean).join(',');

  return useQuery({
    queryKey: ['transactions-for-months', session?.user?.id, monthKey],
    queryFn: async () => {
      const settings = normalizeUserSettings((await getUserSettings()) || {});
      const uniqueMonths = [...new Set(months.filter(Boolean))].sort();
      if (!uniqueMonths.length) return [];

      const firstRange = getBudgetMonthDateRange(uniqueMonths[0], settings);
      const lastRange = getBudgetMonthDateRange(
        uniqueMonths[uniqueMonths.length - 1],
        settings
      );

      if (!firstRange || !lastRange) return [];

      return transactionsApi.listByDateRange(
        firstRange.startDate,
        lastRange.endDate
      );
    },
    enabled: Boolean(session?.user?.id && months.length),
    initialData: [],
  });
}

export function useAllTransactions() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['all-transactions', session?.user?.id],
    queryFn: () => transactionsApi.list(),
    enabled: Boolean(session?.user?.id),
    initialData: [],
  });
}

export function useRecurringTransactions() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['recurring-transactions', session?.user?.id],
    queryFn: () => recurringTransactionsApi.list(),
    enabled: Boolean(session?.user?.id),
    initialData: [],
  });
}

export function useSavingsGoals() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['savings-goals', session?.user?.id],
    queryFn: async () => {
      const goals = await savingsGoalsApi.list();
      return goals.filter((goal) => !goal.is_archived);
    },
    enabled: Boolean(session?.user?.id),
    initialData: [],
  });
}

export function useGoalContributions() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['goal-contributions', session?.user?.id],
    queryFn: () => goalContributionsApi.list(),
    enabled: Boolean(session?.user?.id),
    initialData: [],
  });
}

export function useAllocations(month) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['allocations', session?.user?.id, month],
    queryFn: () => budgetPlansApi.list(month),
    enabled: Boolean(session?.user?.id && month),
    initialData: [],
  });
}

export function useAllAllocations() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['all-allocations', session?.user?.id],
    queryFn: () => budgetPlansApi.list(),
    enabled: Boolean(session?.user?.id),
    initialData: [],
  });
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

function isGoalFundUse(transaction) {
  return isGoalFundUseTransaction(transaction);
}

function isGoalTransfer(transaction) {
  return Boolean(
    transaction?.type === 'transfer' &&
      !isGoalFundUse(transaction) &&
      (getGoalTransactionId(transaction) || transaction?.goal_contribution_id)
  );
}

function getAccountById(accounts = []) {
  return new Map(accounts.map((account) => [account.id, account]));
}

function isDebtTransfer(transaction, accountsById) {
  if (transaction?.type !== 'transfer') return false;
  if (isGoalFundUse(transaction) || isGoalTransfer(transaction)) return false;

  const destinationAccount = accountsById.get(transaction?.to_account_id);
  const category = String(destinationAccount?.category || '').toLowerCase();
  const type = String(destinationAccount?.type || '').toLowerCase();

  return category === 'liability' || ['loan', 'credit_card', 'debt'].includes(type);
}

function buildBudgetSummary({
  categories = [],
  transactions = [],
  allocations = [],
  accounts = [],
  plannedTotals,
}) {
  const accountsById = getAccountById(accounts);

  const getCategorySpent = (categoryId) => {
    return transactions
      .filter(t => t.category_id === categoryId)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  };

  const getCategoryPlanned = (categoryId) => {
    return allocations
      .filter(a => a.category_id === categoryId)
      .reduce((sum, a) => sum + (Number(a.planned_amount) || 0), 0);
  };

  const sumTrackedByType = (type) => {
    return transactions
      .filter((transaction) => {
        if (isGoalFundUse(transaction)) {
          return type === 'debt';
        }

        if (type === 'savings' && isGoalTransfer(transaction)) return true;
        if (type === 'debt' && isDebtTransfer(transaction, accountsById)) return true;
        return getCategoryType(categories, transaction.category_id) === type;
      })
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalTrackedSavings = sumTrackedByType('savings');
  const totalTrackedDebt = sumTrackedByType('debt');

  const planTotals = plannedTotals || buildPlanTotals({ allocations, categories, transactions });
  const totalPlannedIncome = planTotals.income;
  const totalPlannedExpenses = planTotals.expense;
  const totalPlannedSavings = planTotals.savings;
  const totalPlannedDebt = planTotals.debt;

  const leftToAllocate =
    planTotals.leftToAllocate ??
    calculateLeftToAllocateFromTotals({
      ...planTotals,
      fundedDebtPayments: planTotals.fundedDebtPayments || 0,
    });

  return {
    categories,
    transactions,
    allocations,
    accounts,
    getCategorySpent,
    getCategoryPlanned,
    totalIncome,
    totalExpenses,
    totalTrackedSavings,
    totalTrackedDebt,
    totalPlannedIncome,
    totalPlannedExpenses,
    totalPlannedSavings,
    totalPlannedDebt,
    fundedDebtPayments: planTotals.fundedDebtPayments || 0,
    assignablePlannedDebt: planTotals.assignableDebt ?? totalPlannedDebt,
    leftToAllocate,
  };
}

export function useBudgetSummary(month) {
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions(month);
  const { data: allocations = [] } = useAllocations(month);
  const { data: accounts = [] } = useAccounts();

  return buildBudgetSummary({ categories, transactions, allocations, accounts });
}

export function useYearBudgetSummary(year) {
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useAllTransactions();
  const { data: allocations = [] } = useAllAllocations();
  const { data: accounts = [] } = useAccounts();

  const { data: settings = {} } = useUserSettings();

  const yearTransactions = filterTransactionsByBudgetYear(
    transactions,
    year,
    settings
  );
  const yearAllocations = allocations.filter(a => a.month?.startsWith(`${year}-`));
  const allocationsByMonth = yearAllocations.reduce((groups, allocation) => {
    const month = allocation.month;
    if (!month) return groups;
    groups[month] = groups[month] || [];
    groups[month].push(allocation);
    return groups;
  }, {});

  const plannedTotals = Object.values(allocationsByMonth).reduce(
    (sum, monthAllocations) => {
      const month = monthAllocations[0]?.month;
      const monthTransactions = month
        ? filterTransactionsByBudgetMonth(yearTransactions, month, settings)
        : [];
      const monthTotals = buildPlanTotals({
        allocations: monthAllocations,
        categories,
        transactions: monthTransactions,
      });

      return {
        income: sum.income + monthTotals.income,
        expense: sum.expense + monthTotals.expense,
        savings: sum.savings + monthTotals.savings,
        debt: sum.debt + monthTotals.debt,
        fundedDebtPayments:
          (sum.fundedDebtPayments || 0) + Number(monthTotals.fundedDebtPayments || 0),
        assignableDebt:
          (sum.assignableDebt || 0) + Number(monthTotals.assignableDebt || 0),
        leftToAllocate:
          (sum.leftToAllocate || 0) + Number(monthTotals.leftToAllocate || 0),
      };
    },
    {
      income: 0,
      expense: 0,
      savings: 0,
      debt: 0,
      fundedDebtPayments: 0,
      assignableDebt: 0,
      leftToAllocate: 0,
    }
  );

  return buildBudgetSummary({
    categories,
    transactions: yearTransactions,
    allocations: yearAllocations,
    accounts,
    plannedTotals,
  });
}


export function useAutoSweepSurplus() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!session?.user?.id || hasRunRef.current) return;

    hasRunRef.current = true;

    const runAutoSweep = async () => {
      try {
        const settings = normalizeUserSettings((await getUserSettings()) || {});

        if (!isAutoSweepSurplusEnabled(settings)) return;

        const currentBudgetMonth = getCurrentBudgetMonth(settings);
        const closedMonth = getPreviousBudgetMonth(currentBudgetMonth);

        if (!closedMonth) return;

        const [transactions, allocations, categories, accounts] = await Promise.all([
          transactionsApi.list(),
          budgetPlansApi.list(closedMonth),
          categoriesApi.list(),
          accountsApi.list(),
        ]);

        if (hasAutoSweepForMonth(transactions, closedMonth)) return;

        const closedMonthTransactions = filterTransactionsByBudgetMonth(
          transactions,
          closedMonth,
          settings
        );

        const sweepAmount = calculateAutoSweepSurplus({
          transactions: closedMonthTransactions,
          allocations,
          categories,
        });

        if (sweepAmount <= 0) return;

        const { sourceAccount, destinationAccount, savingsCategory } =
          findAutoSweepTargets(accounts, categories, sweepAmount);

        if (!sourceAccount || !destinationAccount || !savingsCategory) {
          console.warn(
            'Auto-sweep skipped: missing source account, savings account, or savings category.'
          );
          return;
        }

        if ((Number(sourceAccount.balance) || 0) < sweepAmount) {
          console.warn('Auto-sweep skipped: source account balance is too low.');
          return;
        }

        const marker = getAutoSweepMarker(closedMonth);
        const sweepDate = getBudgetMonthCloseDate(closedMonth, settings);

        await transactionsApi.create({
          amount: sweepAmount,
          type: 'transfer',
          date: sweepDate,
          note: `${marker} Month-end surplus moved to savings`,
          category_id: savingsCategory.id,
          account_id: sourceAccount.id,
          to_account_id: destinationAccount.id,
        });

        await Promise.all([
          accountsApi.update(sourceAccount.id, {
            balance: (Number(sourceAccount.balance) || 0) - sweepAmount,
          }),
          accountsApi.update(destinationAccount.id, {
            balance: (Number(destinationAccount.balance) || 0) + sweepAmount,
          }),
        ]);

        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
      } catch (error) {
        console.error('Auto-sweep surplus failed:', error);
      }
    };

    runAutoSweep();
  }, [queryClient, session?.user?.id]);
}

export { useCurrencyFormatter, formatCurrency } from '@/hooks/useCurrency';