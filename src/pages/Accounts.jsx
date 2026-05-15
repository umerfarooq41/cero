import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  TrendingUp,
  Building,
  Landmark,
  CreditCard,
  Banknote,
  PiggyBank,
  Wallet,
  ArrowUpRight,
  ChevronRight,
  ChevronUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAccounts } from '@/hooks/useBudgetData';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

const typeIcons = {
  checking: Landmark,
  savings: PiggyBank,
  credit_card: CreditCard,
  cash: Banknote,
  investment: TrendingUp,
  loan: Building,
  other: Wallet,
};

function getCurrencyCode(currency) {
  if (typeof currency === 'string') return currency;
  return currency?.code || currency?.currency || 'SAR';
}

function getCurrencySymbol(currency) {
  const code = getCurrencyCode(currency);

  const map = {
    SAR: 'SAR',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    PKR: 'Rs',
    AED: 'د.إ',
    QAR: 'ر.ق',
    KWD: 'د.ك',
    BHD: '.د.ب',
    OMR: 'ر.ع.',
    TRY: '₺',
    RUB: '₽',
  };

  return currency?.symbol || map[code] || code;
}

function formatNumber(value = 0) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function Money({ amount, currency, compact = false, className = '' }) {
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
        <span>{symbol}</span>
      )}

      <span>{formatNumber(amount)}</span>
    </span>
  );
}

function SummaryLine({ label, amount, currency, tone }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className={cn(
          'mt-1 text-sm font-bold tabular-nums sm:text-base',
          tone === 'positive' && 'text-emerald-600 dark:text-emerald-400',
          tone === 'negative' && 'text-red-600 dark:text-red-400'
        )}
      >
        <Money amount={amount} currency={currency} compact />
      </div>
    </div>
  );
}

export default function Accounts() {
  const currency = useCurrency();
  const { data: accounts = [] } = useAccounts();

  const assets = accounts.filter((account) => account.category === 'asset');
  const liabilities = accounts.filter(
    (account) => account.category === 'liability'
  );

  const totalAssets = assets.reduce(
    (sum, account) => sum + (Number(account.balance) || 0),
    0
  );

  const totalLiabilities = liabilities.reduce(
    (sum, account) => sum + Math.abs(Number(account.balance) || 0),
    0
  );

  const netWorth = totalAssets - totalLiabilities;
  const totalFinancialPosition = totalAssets + totalLiabilities;
  const assetPercent = totalFinancialPosition
    ? (totalAssets / totalFinancialPosition) * 100
    : 100;
  const liabilityPercent = totalFinancialPosition
    ? (totalLiabilities / totalFinancialPosition) * 100
    : 0;
  const hasAccounts = accounts.length > 0;

  const renderGroup = (title, accs, isLiability) => {
    if (accs.length === 0) return null;

    const total = accs.reduce(
      (sum, account) => sum + Math.abs(Number(account.balance) || 0),
      0
    );

    const groupTone = isLiability ? 'red' : 'emerald';
    const HeaderIcon = isLiability ? CreditCard : Wallet;

    return (
      <section
        className={cn(
          'card-elevated overflow-hidden rounded-3xl border bg-card/90 backdrop-blur-xl',
          isLiability
            ? 'border-red-200/70 dark:border-red-500/20'
            : 'border-emerald-200/70 dark:border-emerald-500/20'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b px-4 py-4 sm:px-5',
            isLiability
              ? 'border-red-100/80 bg-red-50/70 dark:border-red-500/15 dark:bg-red-500/10'
              : 'border-emerald-100/80 bg-emerald-50/70 dark:border-emerald-500/15 dark:bg-emerald-500/10'
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
                isLiability
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              )}
            >
              <HeaderIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h3
                className={cn(
                  'text-sm font-extrabold uppercase tracking-wide',
                  groupTone === 'red'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                )}
              >
                {title}
              </h3>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {accs.length} {accs.length === 1 ? 'account' : 'accounts'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                'text-sm font-extrabold tabular-nums sm:text-base',
                isLiability
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              <Money amount={total} currency={currency} compact />
            </span>
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {accs.map((account) => {
            const Icon = typeIcons[account.type] || Wallet;
            const balance = Math.abs(Number(account.balance) || 0);
            const isZero = balance === 0;
            const color = account.color || (isLiability ? '#EF4444' : '#16A34A');

            return (
              <Link
                key={account.id}
                to={`/accounts/${account.id}`}
                className="group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-accent/40 sm:px-5"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${color}14` }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-bold text-foreground sm:text-sm">
                    {account.name}
                  </div>

                  <div className="mt-0.5 text-sm capitalize text-muted-foreground sm:text-xs">
                    {account.type?.replace('_', ' ') || 'Account'}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <div
                      className={cn(
                        'inline-flex items-center text-sm font-extrabold tabular-nums sm:text-base',
                        isZero && 'text-muted-foreground',
                        isLiability && !isZero && 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {isLiability && !isZero && <span className="mr-1">-</span>}
                      <Money amount={balance} currency={currency} compact />
                    </div>

                    {isZero && (
                      <div className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Empty
                      </div>
                    )}

                    {isLiability && !isZero && (
                      <div className="mt-1 inline-flex rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                        Outstanding
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-transparent">
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:pt-8 lg:px-6 lg:pb-10 lg:pt-10">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Accounts
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Your financial overview
            </p>
          </div>

          <Link to="/add-account" className="hidden shrink-0 sm:block">
            <Button className="glass h-11 rounded-2xl px-4 font-semibold text-primary shadow-sm hover:bg-white/80 dark:hover:bg-white/10">
              <Plus className="mr-2 h-4 w-4" />
              Add account
            </Button>
          </Link>
        </header>

        <section className="card-elevated mb-6 overflow-hidden rounded-3xl border border-white/70 bg-card/88 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-card/78 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Net Worth
              </div>

              <div
                className={cn(
                  'mt-3 flex items-center gap-1 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl',
                  netWorth >= 0
                    ? 'text-foreground'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {netWorth < 0 && <span>-</span>}
                <Money amount={Math.abs(netWorth)} currency={currency} />
              </div>
            </div>

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner sm:h-20 sm:w-20">
              <ArrowUpRight className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-start gap-4">
            <SummaryLine
              label="Assets"
              amount={totalAssets}
              currency={currency}
              tone="positive"
            />

            <div className="mt-1 h-10 w-px bg-border" />

            <SummaryLine
              label="Liabilities"
              amount={totalLiabilities}
              currency={currency}
              tone="negative"
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-full bg-muted shadow-inner">
            <div className="flex h-7 w-full overflow-hidden rounded-full text-xs font-bold text-white">
              <div
                className="flex min-w-[2.5rem] items-center justify-center bg-emerald-500"
                style={{ width: `${Math.max(assetPercent, 0)}%` }}
              >
                {assetPercent > 12 && `${assetPercent.toFixed(1)}%`}
              </div>

              <div
                className="flex min-w-[2.5rem] items-center justify-center bg-red-500"
                style={{ width: `${Math.max(liabilityPercent, 0)}%` }}
              >
                {liabilityPercent > 6 && `${liabilityPercent.toFixed(1)}%`}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Assets
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Liabilities
            </div>
          </div>
        </section>

        <div className="space-y-5">
          {renderGroup('Assets', assets, false)}
          {renderGroup('Liabilities', liabilities, true)}
        </div>

        {hasAccounts ? (
          <Link to="/add-account">
            <Button
              className="fixed bottom-24 right-5 z-50 h-14 w-14 rounded-2xl p-0 shadow-xl shadow-primary/30 lg:bottom-6"
              size="icon"
              aria-label="Add account"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
        ) : (
          <Link to="/add-account">
            <Button className="mt-6 h-12 w-full rounded-2xl font-semibold shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Add your first account
            </Button>
          </Link>
        )}
      </main>
    </div>
  );
}
