import { useQuery } from '@tanstack/react-query';
import { accountsApi, budgetPlansApi, categoriesApi, transactionsApi } from '@/lib/budgetData';
import { useAuth } from '@/contexts/AuthContext';

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

export function useBudgetSummary(month) {
  const { data: categories = [] } = useCategories();
  const { data: transactions = [] } = useTransactions(month);
  const { data: allocations = [] } = useAllocations(month);

  const getCategorySpent = (categoryId) => {
    return transactions
      .filter(t => t.category_id === categoryId)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  };

  const getCategoryPlanned = (categoryId) => {
    const alloc = allocations.find(a => a.category_id === categoryId);
    return Number(alloc?.planned_amount) || 0;
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

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
    totalPlannedIncome,
    totalPlannedExpenses,
    totalPlannedSavings,
    totalPlannedDebt,
    leftToAllocate,
  };
}

export { useCurrencyFormatter, formatCurrency } from '@/hooks/useCurrency';