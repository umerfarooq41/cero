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
      <div className="surface-card card-elevated overflow-hidden rounded-[1.75rem] border border-white/40 dark:border-white/[0.05]">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
          <div>
            <h3
              className={cn(
                'text-sm font-bold uppercase tracking-[0.18em]',
                isLiability
                  ? 'text-destructive'
                  : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {title}
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              {accs.length} {accs.length === 1 ? 'account' : 'accounts'}
            </p>
          </div>

          <div
            className={cn(
                'text-base font-bold tracking-tight tabular-nums sm:text-lg',              isLiability
                ? 'text-destructive'
                : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            <InlineMoney>{formatCurrency(total)}</InlineMoney>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/40">
          {accs.map((acc) => {
            const Icon = typeIcons[acc.type] || Wallet;
            const balance = Math.abs(Number(acc.balance) || 0);

            return (
              <Link
                key={acc.id}
                to={`/accounts/${acc.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/20 dark:hover:bg-white/[0.03]"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${acc.color || '#0078D4'}15`,
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{
                      color: acc.color || '#0078D4',
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-foreground sm:text-base">
                    {acc.name}
                  </div>

                  <div className="mt-0.5 text-sm capitalize text-muted-foreground">
                    {acc.type?.replace('_', ' ') || 'Account'}
                  </div>
                </div>

                {/* Neutral Amount Color */}
                <div className="text-right">
                  <div className="text-sm font-bold tracking-tight text-foreground tabular-nums sm:text-base">
                    <InlineMoney>{formatCurrency(balance)}</InlineMoney>
                  </div>
                </div>
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
        
        {/* Net Worth Card */}
        <section className="surface-card card-elevated mb-8 rounded-[2rem] border border-white/40 p-5 dark:border-white/[0.05] sm:p-6">
          
          <div className="flex flex-col items-center justify-center text-center">
            
            {/* Title */}
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />

              <div className="text-sm font-semibold tracking-wide text-muted-foreground">
                Net Worth
              </div>
            </div>

            {/* Amount */}
            <div
              className={cn(
                'mt-3 flex items-center justify-center gap-1 text-2xl font-black tracking-tight tabular-nums sm:text-4xl',
                netWorth >= 0 ? 'text-foreground' : 'text-destructive'
              )}
            >
              {netWorth < 0 && <span>-</span>}
              <InlineMoney>{formatCurrency(Math.abs(netWorth))}</InlineMoney>
            </div>

            {/* Subtext */}
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              The current equilibrium of your efforts
            </p>
          </div>

          {/* Bottom Cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
            
            {/* Assets */}
            <div className="rounded-[1.15rem] border border-white/45 bg-white/35 p-3.5 shadow-sm backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.03] sm:p-4">
              
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 sm:text-sm">
                <ArrowUpRight className="h-4 w-4" />
                <span>Assets</span>
              </div>

              <div className="text-sm font-bold tracking-tight text-foreground tabular-nums">
                <InlineMoney>{formatCurrency(totalAssets)}</InlineMoney>
              </div>

              <div className="mt-1 text-xs font-medium text-muted-foreground">
                {assets.length} {assets.length === 1 ? 'account' : 'accounts'}
              </div>
            </div>

            {/* Liabilities */}
            <div className="rounded-[1.15rem] border border-white/45 bg-white/35 p-3.5 shadow-sm backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.03] sm:p-4">
              
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-destructive sm:text-sm">
                <ArrowDownRight className="h-4 w-4" />
                <span>Liabilities</span>
              </div>

              <div className="text-sm font-bold tracking-tight text-foreground tabular-nums">
                <InlineMoney>{formatCurrency(totalLiabilities)}</InlineMoney>
              </div>

              <div className="mt-1 text-xs font-medium text-muted-foreground">
                {liabilities.length} {liabilities.length === 1 ? 'account' : 'accounts'}
              </div>
            </div>
          </div>
        </section>

        {/* Account Groups */}
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