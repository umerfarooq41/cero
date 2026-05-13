import { useQuery } from '@tanstack/react-query';
import { accountsApi, budgetPlansApi, categoriesApi, transactionsApi } from '@/lib/budgetData';
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

export function useTransactions(month) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['transactions', session?.user?.id, month],
    queryFn: async () => {
      const all = await transactionsApi.list();
      if (!month) return all;
      return all.filter(t => t.date?.startsWith(month));
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

  const yearTransactions = transactions.filter(t => t.date?.startsWith(`${year}-`));
  const yearAllocations = allocations.filter(a => a.month?.startsWith(`${year}-`));

  return buildBudgetSummary({
    categories,
    transactions: yearTransactions,
    allocations: yearAllocations,
  });
}

export { useCurrencyFormatter, formatCurrency } from '@/hooks/useCurrency';
