import { cn } from '@/lib/utils';
import ReflectCard from './ReflectCard.jsx';

export const getCurrencyCode = (currency) => {
  if (typeof currency === 'string') return currency;
  return currency?.code || currency?.currency || 'SAR';
};

export const getCurrencySymbol = (currency) => {
  const code = getCurrencyCode(currency);

  const map = {
    SAR: 'SAR',
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    PKR: 'Rs',
    AED: 'د.إ',
    QAR: 'ر.ق',
    KWD: 'د.ك',
    BHD: '.د.ب',
    OMR: 'ر.ع.',
  };

  return currency?.symbol || map[code] || code;
};

export const formatNumber = (value = 0) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: number % 1 === 0 ? 0 : 2,
  }).format(number);
};

export const formatCurrencyText = (value, currency) => {
  const code = getCurrencyCode(currency);
  const symbol = getCurrencySymbol(currency);

  if (code === 'SAR') return `SAR ${formatNumber(value)}`;

  return `${symbol} ${formatNumber(value)}`;
};

function RiyalIcon({ className }) {
  return (
    <span
      className={cn('inline-block shrink-0 bg-current', className)}
      style={{
        WebkitMask: "url('/sar.svg') center / contain no-repeat",
        mask: "url('/sar.svg') center / contain no-repeat",
      }}
    />
  );
}

export function CurrencyAmount({
  amount,
  currency,
  compact = false,
  className,
}) {
  const code = getCurrencyCode(currency);
  const symbol = getCurrencySymbol(currency);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 align-middle whitespace-nowrap leading-none text-current',
        className
      )}
    >
      {code === 'SAR' ? (
        <RiyalIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      ) : (
        <span>{symbol}</span>
      )}

      <span>{formatNumber(amount)}</span>
    </span>
  );
}

export function InlineMoney({ children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center align-middle whitespace-nowrap leading-none text-current',
        className
      )}
    >
      {children}
    </span>
  );
}

export default function ReflectSummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'default',
}) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-700 dark:text-emerald-300'
      : tone === 'bad'
        ? 'text-red-700 dark:text-red-300'
        : tone === 'blue'
          ? 'text-blue-700 dark:text-blue-300'
          : tone === 'purple'
            ? 'text-violet-700 dark:text-violet-300'
            : 'text-foreground';

  return (
    <ReflectCard
      className={cn(
        'relative min-h-[112px] overflow-hidden p-4',
        tone === 'good' &&
          'bg-gradient-to-br from-emerald-50 via-card to-card dark:from-emerald-950/30',
        tone === 'bad' &&
          'bg-gradient-to-br from-red-50 via-card to-card dark:from-red-950/30',
        tone === 'blue' &&
          'bg-gradient-to-br from-blue-50 via-card to-card dark:from-blue-950/30',
        tone === 'purple' &&
          'bg-gradient-to-br from-violet-50 via-card to-card dark:from-violet-950/30'
      )}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/35 dark:bg-white/5" />

      <div className="relative flex h-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs leading-none text-muted-foreground">
            {title}
          </p>

          <div
            className={cn(
              'flex min-h-[24px] items-center text-xl font-bold leading-none tabular-nums',
              toneClass
            )}
          >
            {value}
          </div>

          {subtitle && (
            <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px] leading-snug text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background/70 shadow-sm">
          <Icon className={cn('h-4 w-4', toneClass)} />
        </div>
      </div>
    </ReflectCard>
  );
}
