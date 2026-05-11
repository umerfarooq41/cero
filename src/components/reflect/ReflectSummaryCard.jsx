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
        <RiyalIcon className={compact ? 'h-[0.82em] w-[0.82em]' : 'h-[0.9em] w-[0.9em]'} />
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
      ? 'text-emerald-500'
      : tone === 'bad'
        ? 'text-destructive'
        : tone === 'blue'
          ? 'text-blue-500'
          : tone === 'purple'
            ? 'text-violet-500'
            : 'text-primary';

  const iconBg =
    tone === 'good'
      ? 'bg-emerald-500/10'
      : tone === 'bad'
        ? 'bg-destructive/10'
        : tone === 'blue'
          ? 'bg-blue-500/10'
          : tone === 'purple'
            ? 'bg-violet-500/10'
            : 'bg-primary/10';

  return (
    <ReflectCard className="min-h-[112px] p-4">
      <div className="flex h-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-xs leading-none text-muted-foreground">
            {title}
          </p>

          <div
            className={cn(
              'min-h-[28px] text-2xl font-bold leading-none tabular-nums',
              toneClass
            )}
          >
            {value}
          </div>

          {subtitle && (
            <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] leading-snug text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>

        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl',
            iconBg
          )}
        >
          <Icon className={cn('h-4 w-4', toneClass)} />
        </div>
      </div>
    </ReflectCard>
  );
}
