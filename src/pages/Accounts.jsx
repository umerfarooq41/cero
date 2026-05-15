import React from 'react';
import { Link } from 'react-router-dom';
import {
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
import FloatingActionButton from '@/components/shared/FloatingActionButton';
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

          <span
            className={cn(
              'text-sm font-bold tabular-nums',
              isLiability ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
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

                <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-sm font-semibold text-foreground tabular-nums">
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
        <section className="surface-card card-elevated mb-8 rounded-[2rem] border border-white/40 p-5 dark:border-white/[0.05] sm:p-6">
          <div className="grid grid-cols-[auto_1fr] items-center gap-4 sm:grid-cols-[auto_1fr_auto]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                <Scale className="h-5 w-5" />
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Net Worth
                </div>
                <div className="mt-1 text-xs font-medium text-muted-foreground sm:hidden">
                  Assets minus liabilities
                </div>
              </div>
            </div>

            <div
              className={cn(
                'col-span-2 mt-4 flex items-center justify-center gap-1 text-4xl font-black tracking-tight tabular-nums sm:col-span-1 sm:mt-0 sm:text-5xl',
                netWorth >= 0 ? 'text-foreground' : 'text-destructive'
              )}
            >
              {netWorth < 0 && <span>-</span>}
              <InlineMoney>{formatCurrency(Math.abs(netWorth))}</InlineMoney>
            </div>
          </div>

          <p className="mt-4 border-t border-border/50 pt-4 text-center text-sm font-medium text-muted-foreground sm:text-base">
            The current equilibrium of your efforts
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-[1.15rem] border border-white/45 bg-white/35 p-3.5 shadow-sm backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.03] sm:p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 sm:text-sm">
                <ArrowUpRight className="h-4 w-4" />
                <span>Assets</span>
              </div>

              <div className="text-lg font-extrabold tracking-tight text-foreground tabular-nums sm:text-xl">
                <InlineMoney>{formatCurrency(totalAssets)}</InlineMoney>
              </div>

              <div className="mt-1 text-xs font-medium text-muted-foreground">
                {assets.length} {assets.length === 1 ? 'account' : 'accounts'}
              </div>
            </div>

            <div className="rounded-[1.15rem] border border-white/45 bg-white/35 p-3.5 shadow-sm backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.03] sm:p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-destructive sm:text-sm">
                <ArrowDownRight className="h-4 w-4" />
                <span>Liabilities</span>
              </div>

              <div className="text-lg font-extrabold tracking-tight text-foreground tabular-nums sm:text-xl">
                <InlineMoney>{formatCurrency(totalLiabilities)}</InlineMoney>
              </div>

              <div className="mt-1 text-xs font-medium text-muted-foreground">
                {liabilities.length} {liabilities.length === 1 ? 'account' : 'accounts'}
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          {renderGroup('Assets', assets, false)}
          {renderGroup('Liabilities', liabilities, true)}
        </div>

        <FloatingActionButton
          to="/add-account"
          ariaLabel="Add account"
        />
      </main>
    </div>
  );
}