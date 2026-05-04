import { useQuery } from '@tanstack/react-query';
import { getUserSettings } from '@/lib/budgetData';
import { useAuth } from '@/lib/AuthContext';

export function useCurrency() {
  const { session } = useAuth();
  const { data: symbol = '$' } = useQuery({
    queryKey: ['currency-symbol', session?.user?.id],
    queryFn: async () => {
      const settings = await getUserSettings();
      return settings?.currency || '$';
    },
    enabled: Boolean(session?.user?.id),
    staleTime: Infinity,
  });
  return symbol;
}

export function useCurrencyFormatter() {
  const symbol = useCurrency();
  return (amount) => formatCurrency(amount, symbol);
}

export function formatCurrency(amount, symbol = '$') {
  return symbol + Math.abs(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
