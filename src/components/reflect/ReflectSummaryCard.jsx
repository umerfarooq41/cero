import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Wallet,
} from 'lucide-react';

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
        <RiyalIcon
          className={compact ? 'h-[0.82em] w-[0.82em]' : 'h-[0.9em] w-[0.9em]'}
        />
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

function SummaryCard({ title, value, subtitle, icon: Icon, tone = 'default' }) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'bad'
        ? 'text-destructive'
        : tone === 'blue'
          ? 'text-blue-600 dark:text-blue-400'
          : tone === 'purple'
            ? 'text-violet-600 dark:text-violet-400'
            : 'text-foreground';

  const iconBg =
    tone === 'good'
      ? 'bg-emerald-500/10'
      : tone === 'bad'
        ? 'bg-destructive/10'
        : tone === 'blue'
          ? 'bg-blue-500/10'
          : tone === 'purple'
            ? 'bg-violet-500/10'
            : 'bg-muted';

  return (
    <ReflectCard className="min-h-[128px] p-4">
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{title}</p>

          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
              iconBg
            )}
          >
            <Icon className={cn('h-4 w-4', toneClass)} />
          </div>
        </div>

        <div>
          <div
            className={cn(
              'text-xl font-bold leading-none tabular-nums sm:text-2xl',
              toneClass
            )}
          >
            {value}
          </div>

          {subtitle && (
            <div className="mt-3 text-xs font-medium leading-snug text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </ReflectCard>
  );
}

function MoneyRow({ label, amount, currency, tone }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>

      <span className={cn('font-semibold tabular-nums', tone)}>
        <CurrencyAmount amount={amount} currency={currency} compact />
      </span>
    </div>
  );
}

export default function ReflectSummaryCard({
  isYear,
  income,
  expenses,
  plannedIncome,
  plannedExpenses,
  netCashFlow,
  netWorth,
  totalAssets,
  totalLiabilities,
  savingsRate,
  currency,
}) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Income"
        value={<CurrencyAmount amount={income} currency={currency} />}
        subtitle={
          !isYear && plannedIncome > 0 ? (
            <span className="flex items-center gap-1">
              <CurrencyAmount amount={plannedIncome} currency={currency} compact />
              <span>planned</span>
            </span>
          ) : isYear ? (
            'Full-year total'
          ) : (
            'No planned income'
          )
        }
        icon={ArrowUpRight}
        tone="good"
      />

      <SummaryCard
        title="Expenses"
        value={<CurrencyAmount amount={expenses} currency={currency} />}
        subtitle={
          !isYear && plannedExpenses > 0 ? (
            <span className="flex items-center gap-1">
              <CurrencyAmount amount={plannedExpenses} currency={currency} compact />
              <span>planned</span>
            </span>
          ) : isYear ? (
            'Full-year total'
          ) : (
            'No planned expenses'
          )
        }
        icon={ArrowDownRight}
        tone={expenses > plannedExpenses && plannedExpenses > 0 ? 'bad' : 'blue'}
      />

      <SummaryCard
        title="Net Cash Flow"
        value={<CurrencyAmount amount={netCashFlow} currency={currency} />}
        subtitle={savingsRate ? `${savingsRate}% savings rate` : 'This period'}
        icon={Wallet}
        tone={netCashFlow >= 0 ? 'good' : 'bad'}
      />

      <SummaryCard
        title="Net Worth"
        value={<CurrencyAmount amount={netWorth} currency={currency} />}
        subtitle={
          <div className="space-y-1.5">
            <MoneyRow
              label="Assets"
              amount={totalAssets}
              currency={currency}
              tone="text-emerald-600 dark:text-emerald-400"
            />

            <MoneyRow
              label="Liabilities"
              amount={totalLiabilities}
              currency={currency}
              tone="text-destructive"
            />
          </div>
        }
        icon={TrendingUp}
        tone={netWorth >= 0 ? 'purple' : 'bad'}
      />
    </div>
  );
}