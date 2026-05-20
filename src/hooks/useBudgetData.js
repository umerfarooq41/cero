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
  calculateAutoSweepSurplus,
  filterTransactionsByBudgetMonth,
  filterTransactionsByBudgetYear,
  findAutoSweepTargets,
  getAutoSweepMarker,
  getBudgetMonthCloseDate,
  getCurrentBudgetMonth,
  getPreviousBudgetMonth,
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

export function useTransactions(month) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['transactions', session?.user?.id, month],
    queryFn: async () => {
      const [all, settings] = await Promise.all([
        transactionsApi.list(),
        getUserSettings(),
      ]);

      return filterTransactionsByBudgetMonth(all, month, settings || {});
    },
    enabled: Boolean(session?.user?.id),
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

function buildBudgetSummary({ categories = [], transactions = [], allocations = [] }) {
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

  const getCategoryType = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return null;

    if (category.type) return category.type;

    const parent = categories.find(c => c.id === category.parent_id);
    return parent?.type || null;
  };

  const sumTrackedByType = (type) => {
    return transactions
      .filter(t => getCategoryType(t.category_id) === type)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  };

  const sumPlannedByType = (type) => {
    return categories
      .filter(c => c.type === type && !c.parent_id)
      .reduce((sum, c) => {
        const subs = categories.filter(s => s.parent_id === c.id);

        if (subs.length > 0) {
          return sum + subs.reduce((s, sub) => s + getCategoryPlanned(sub.id), 0);
        }

        return sum + getCategoryPlanned(c.id);
      }, 0);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalTrackedSavings = sumTrackedByType('savings');
  const totalTrackedDebt = sumTrackedByType('debt');

  const totalPlannedIncome = sumPlannedByType('income');
  const totalPlannedExpenses = sumPlannedByType('expense');
  const totalPlannedSavings = sumPlannedByType('savings');
  const totalPlannedDebt = sumPlannedByType('debt');

  const leftToAllocate =
    totalPlannedIncome -
    totalPlannedExpenses -
    totalPlannedSavings -
    totalPlannedDebt;

  return {
    categories,
    transactions,
    allocations,
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
    leftToAllocate,
  };
}

export function useBudgetSummary(month) {
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions(month);
  const { data: allocations = [] } = useAllocations(month);

  return buildBudgetSummary({ categories, transactions, allocations });
}

export function useYearBudgetSummary(year) {
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useAllTransactions();
  const { data: allocations = [] } = useAllAllocations();

  const { data: settings = {} } = useUserSettings();

  const yearTransactions = filterTransactionsByBudgetYear(
    transactions,
    year,
    settings
  );
  const yearAllocations = allocations.filter(a => a.month?.startsWith(`${year}-`));

  return buildBudgetSummary({
    categories,
    transactions: yearTransactions,
    allocations: yearAllocations,
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
