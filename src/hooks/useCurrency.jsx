import { useQuery } from '@tanstack/react-query';
import { getUserSettings } from '@/lib/budgetData';
import { useAuth } from '@/lib/AuthContext';
import { getCurrencyCode, getCurrencySymbol } from '@/lib/currencies';

export function useCurrency() {
  const { session } = useAuth();

  const { data: currencyCode = 'SAR' } = useQuery({
    queryKey: ['currency-code', session?.user?.id],
    queryFn: async () => {
      const settings = await getUserSettings();
      return settings?.currency || 'SAR';
    },
    enabled: Boolean(session?.user?.id),
    staleTime: 0,
  });

  return currencyCode;
}

export function useCurrencyFormatter() {
  const currencyCode = useCurrency();

  return (amount) => formatCurrency(amount, currencyCode);
}

export function formatCurrency(amount, currency = 'SAR') {
  const code = getCurrencyCode(currency);
  const symbol = getCurrencySymbol(code);

  const value = Math.abs(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (code === 'SAR') {
    return (
      <span className="inline-flex items-center gap-1 align-middle text-inherit tabular-nums">
        <span
          className="
            inline-block
            h-[1em]
            w-[1em]
            shrink-0
            bg-current
            align-middle
          "
          style={{
            WebkitMask: 'url(/sar.svg) center / contain no-repeat',
            mask: 'url(/sar.svg) center / contain no-repeat',
          }}
        />

        <span className="leading-none tabular-nums">
          {value}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 tabular-nums">
      <span>{symbol}</span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}
