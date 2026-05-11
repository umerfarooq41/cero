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
  ArrowDownRight,
  Scale,
} from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { useAccounts, useCurrencyFormatter } from '@/hooks/useBudgetData';
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

function InlineMoney({ children }) {
  return (
    <span className="inline-flex items-center align-middle whitespace-nowrap">
      {children}
    </span>
  );
}

export default function Accounts() {
  const formatCurrency = useCurrencyFormatter();
  const { data: accounts = [] } = useAccounts();

  const assets = accounts.filter((a) => a.category === 'asset');
  const liabilities = accounts.filter((a) => a.category === 'liability');

  const totalAssets = assets.reduce(
    (s, a) => s + (Number(a.balance) || 0),
    0
  );

  const totalLiabilities = liabilities.reduce(
    (s, a) => s + Math.abs(Number(a.balance) || 0),
    0
  );

  const netWorth = totalAssets - totalLiabilities;

  const renderGroup = (title, accs, isLiability) => {
    if (accs.length === 0) return null;

    const total = accs.reduce(
      (s, a) => s + Math.abs(Number(a.balance) || 0),
      0
    );

    return (
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div
          className={cn(
            'flex items-center justify-between gap-3 border-b px-5 py-4',
            isLiability
              ? 'border-red-200/60 bg-red-500/5 dark:border-red-950/60'
              : 'border-emerald-200/60 bg-emerald-500/5 dark:border-emerald-950/60'
          )}
        >
          <div>
            <h3
              className={cn(
                'text-xs font-semibold uppercase tracking-wider',
                isLiability
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

          <span
            className={cn(
              'text-sm font-bold tabular-nums',
              isLiability ? 'text-red-600 dark:text-red-400' : 'text-foreground'
            )}
          >
            {isLiability && '-'}
            <InlineMoney>{formatCurrency(total)}</InlineMoney>
          </span>
        </div>

        <div className="divide-y divide-border/50">
          {accs.map((acc) => {
            const Icon = typeIcons[acc.type] || Wallet;
            const balance = Math.abs(Number(acc.balance) || 0);
            const color = acc.color || (isLiability ? '#DC2626' : '#059669');

            return (
              <Link
                key={acc.id}
                to={`/accounts/${acc.id}`}
                className="group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-accent/50"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {acc.name}
                  </div>

                  <div className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {acc.type?.replace('_', ' ') || 'Account'}
                  </div>
                </div>

                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 whitespace-nowrap text-sm font-bold tabular-nums',
                    isLiability ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                  )}
                >
                  {isLiability && <span>-</span>}
                  <InlineMoney>{formatCurrency(balance)}</InlineMoney>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Accounts"
        subtitle="Assets, savings, and debt overview"
      />

      <main className="mx-auto w-full max-w-3xl px-4 py-4 pb-24 lg:py-8">
        <section className="mb-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Net Worth
                </div>

                <div
                  className={cn(
                    'mt-2 flex items-center gap-1 text-4xl font-bold tracking-tight tabular-nums',
                    netWorth >= 0 ? 'text-foreground' : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {netWorth < 0 && <span>-</span>}
                  <InlineMoney>{formatCurrency(Math.abs(netWorth))}</InlineMoney>
                </div>
              </div>

              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                  netWorth >= 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                )}
              >
                <Scale className="h-6 w-6" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-200/60 bg-emerald-500/10 p-4 dark:border-emerald-950/60">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <ArrowUpRight className="h-4 w-4" />
                  Assets
                </div>

                <div className="text-base font-bold tabular-nums text-foreground">
                  <InlineMoney>{formatCurrency(totalAssets)}</InlineMoney>
                </div>
              </div>

              <div className="rounded-2xl border border-red-200/60 bg-red-500/10 p-4 dark:border-red-950/60">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-red-700 dark:text-red-400">
                  <ArrowDownRight className="h-4 w-4" />
                  Liabilities
                </div>

                <div className="text-base font-bold tabular-nums text-red-600 dark:text-red-400">
                  <InlineMoney>{formatCurrency(totalLiabilities)}</InlineMoney>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          {renderGroup('Assets', assets, false)}
          {renderGroup('Liabilities', liabilities, true)}
        </div>

        <Link to="/add-account">
          <Button
            className="fixed bottom-24 right-5 z-50 h-14 w-14 rounded-2xl p-0 shadow-lg shadow-primary/25 lg:bottom-6"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </main>
    </div>
  );
}