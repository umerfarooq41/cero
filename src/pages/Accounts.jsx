import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Building,
  Landmark,
  CreditCard,
  Banknote,
  PiggyBank,
  Wallet,
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
      <div className="surface-card card-elevated rounded-xl border border-white/40 dark:border-white/[0.05] overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border">
          <h3
            className={cn(
              'text-xs font-bold uppercase tracking-wider',
              isLiability ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            {title}
          </h3>

          <span className="text-sm font-semibold tabular-nums">
            <InlineMoney>{formatCurrency(total)}</InlineMoney>
          </span>
        </div>

        <div className="divide-y divide-border/50">
          {accs.map((acc) => {
            const Icon = typeIcons[acc.type] || Wallet;
            const balance = Math.abs(Number(acc.balance) || 0);

            return (
              <Link
                key={acc.id}
                to={`/accounts/${acc.id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${acc.color || '#0078D4'}18` }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: acc.color || '#0078D4' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{acc.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {acc.type?.replace('_', ' ') || 'Account'}
                  </div>
                </div>

                <span
                  className={cn(
                    'text-sm font-semibold tabular-nums inline-flex items-center gap-0.5 whitespace-nowrap',
                    isLiability ? 'text-destructive' : 'text-foreground'
                  )}
                >
                  {isLiability && <span>-</span>}
                  <InlineMoney>{formatCurrency(balance)}</InlineMoney>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Accounts"
        subtitle="Your financial overview"
      />

      <main className="mx-auto w-full max-w-3xl px-4 py-4 pb-28 lg:py-8">
        <section className="surface-card card-elevated mb-8 rounded-[2rem] border border-white/40 p-7 text-center dark:border-white/[0.05] sm:p-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
            <Scale className="h-7 w-7" />
          </div>

          <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Net Worth
          </div>

          <div
            className={cn(
              'mb-3 flex items-center justify-center gap-1 text-4xl font-black tracking-tight tabular-nums sm:text-5xl',
              netWorth >= 0 ? 'text-foreground' : 'text-destructive'
            )}
          >
            {netWorth < 0 && <span>-</span>}
            <InlineMoney>{formatCurrency(Math.abs(netWorth))}</InlineMoney>
          </div>

          <p className="mb-8 text-sm font-medium text-muted-foreground sm:text-base">
            Assets minus liabilities
          </p>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-[1.35rem] border border-white/45 bg-white/45 p-4 text-left shadow-sm backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.03] sm:p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 sm:text-base">
                <ArrowUpRight className="h-5 w-5" />
                <span>Assets</span>
              </div>

              <div className="text-xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-2xl">
                <InlineMoney>{formatCurrency(totalAssets)}</InlineMoney>
              </div>

              <div className="mt-2 text-xs font-medium text-muted-foreground sm:text-sm">
                {assets.length} {assets.length === 1 ? 'account' : 'accounts'}
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-white/45 bg-white/45 p-4 text-left shadow-sm backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.03] sm:p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-bold text-destructive sm:text-base">
                <ArrowDownRight className="h-5 w-5" />
                <span>Liabilities</span>
              </div>

              <div className="text-xl font-extrabold tracking-tight text-foreground tabular-nums sm:text-2xl">
                <InlineMoney>{formatCurrency(totalLiabilities)}</InlineMoney>
              </div>

              <div className="mt-2 text-xs font-medium text-muted-foreground sm:text-sm">
                {liabilities.length} {liabilities.length === 1 ? 'account' : 'accounts'}
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
            className="fixed bottom-24 right-5 z-50 h-16 w-16 rounded-[1.65rem] p-0 shadow-2xl shadow-primary/30 transition-transform hover:scale-105 active:scale-95 lg:bottom-8 lg:right-8"
            size="icon"
          >
            <Plus className="h-7 w-7" />
          </Button>
        </Link>
      </main>
    </div>
  );
}