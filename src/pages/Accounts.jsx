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
    (sum, account) => sum + (Number(account.balance) || 0),
    0
  );

  const totalLiabilities = liabilities.reduce(
    (sum, account) => sum + Math.abs(Number(account.balance) || 0),
    0
  );

  const netWorth = totalAssets - totalLiabilities;
  const hasAccounts = accounts.length > 0;

  const renderGroup = (title, accs, isLiability) => {
    if (accs.length === 0) return null;

    const total = accs.reduce(
      (sum, account) => sum + Math.abs(Number(account.balance) || 0),
      0
    );

    return (
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-background/40 px-5 py-4">
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

          <span className="inline-flex items-center text-sm font-bold tabular-nums text-foreground">
            <InlineMoney>{formatCurrency(total)}</InlineMoney>
          </span>
        </div>

        <div className="divide-y divide-border/50">
          {accs.map((account) => {
            const Icon = typeIcons[account.type] || Wallet;
            const balance = Math.abs(Number(account.balance) || 0);
            const color = account.color || (isLiability ? '#DC2626' : '#059669');

            return (
              <Link
                key={account.id}
                to={`/accounts/${account.id}`}
                className="group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-accent/50"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${color}14` }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {account.name}
                  </div>

                  <div className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {account.type?.replace('_', ' ') || 'Account'}
                  </div>
                </div>

                <span className="inline-flex items-center whitespace-nowrap text-sm font-bold tabular-nums text-foreground">
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
          <div className="p-6 text-center">
            <div
              className={cn(
                'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl',
                netWorth >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              )}
            >
              <Scale className="h-5 w-5" />
            </div>

            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Net Worth
            </div>

            <div
              className={cn(
                'mt-2 flex items-center justify-center gap-1 text-4xl font-bold tracking-tight tabular-nums',
                netWorth >= 0
                  ? 'text-foreground'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {netWorth < 0 && <span>-</span>}
              <InlineMoney>{formatCurrency(Math.abs(netWorth))}</InlineMoney>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Your progress, measured in value.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="h-4 w-4" />
                  Assets
                </div>

                <div className="text-base font-bold tabular-nums text-foreground">
                  <InlineMoney>{formatCurrency(totalAssets)}</InlineMoney>
                </div>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  {assets.length} {assets.length === 1 ? 'account' : 'accounts'}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400">
                  <ArrowDownRight className="h-4 w-4" />
                  Liabilities
                </div>

                <div className="text-base font-bold tabular-nums text-foreground">
                  <InlineMoney>{formatCurrency(totalLiabilities)}</InlineMoney>
                </div>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  {liabilities.length}{' '}
                  {liabilities.length === 1 ? 'account' : 'accounts'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          {renderGroup('Assets', assets, false)}
          {renderGroup('Liabilities', liabilities, true)}
        </div>

        {hasAccounts && (
          <Link to="/add-account">
            <Button
              className="fixed bottom-24 right-5 z-50 h-14 w-14 rounded-2xl p-0 shadow-lg shadow-primary/25 lg:bottom-6"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
        )}

        {!hasAccounts && (
          <Link to="/add-account">
            <Button className="mt-6 h-12 w-full rounded-xl font-semibold">
              <Plus className="mr-2 h-4 w-4" />
              Add your first account
            </Button>
          </Link>
        )}
      </main>
    </div>
  );
}