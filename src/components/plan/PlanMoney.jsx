import {
  getCurrencyCode,
  getCurrencySymbol,
  formatCurrencyNumberText,
} from '@/lib/currencies';
import { cn } from '@/lib/utils';

export function formatPlanNumber(value = 0) {
  const number = Number(value || 0);

  return formatCurrencyNumberText(number, { smart: true });
}

export default function PlanMoney({ amount, currency, compact = false, className = '' }) {
  const code = getCurrencyCode(currency);
  const symbol = getCurrencySymbol(currency);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 align-middle whitespace-nowrap leading-none text-current tabular-nums',
        className
      )}
    >
      {code === 'SAR' ? (
        <span
          className={cn(
            'inline-block shrink-0 bg-current align-middle',
            compact ? 'h-[0.8em] w-[0.8em]' : 'h-[0.9em] w-[0.9em]'
          )}
          style={{
            WebkitMask: 'url(/sar.svg) center / contain no-repeat',
            mask: 'url(/sar.svg) center / contain no-repeat',
          }}
        />
      ) : (
        <span className="text-current">{symbol}</span>
      )}

      <span className="tabular-nums">{formatPlanNumber(amount)}</span>
    </span>
  );
}
