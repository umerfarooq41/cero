import { useQuery } from '@tanstack/react-query';
import { getUserSettings } from '@/lib/budgetData';
import { useAuth } from '@/contexts/AuthContext';

export function useCurrency() {
  const { session } = useAuth();

  const { data: symbol = 'SAR' } = useQuery({
    queryKey: ['currency-symbol', session?.user?.id],
    queryFn: async () => {
      const settings = await getUserSettings();
      return settings?.currency || 'SAR'; // ✅ default SAR
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

export function formatCurrency(amount, symbol = 'SAR') {
  const value = Math.abs(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (symbol === 'SAR') {
    return (
      <span className="inline-flex items-center gap-1">
        <img src="/sar.svg" alt="SAR" className="w-4 h-4 shrink-0" />
        <span>{value}</span>
      </span>
    );
  }

  return `${symbol}${value}`;
}