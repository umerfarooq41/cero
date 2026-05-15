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
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-3">
          <div>
            <h3
              className={cn(
                'text-sm font-semibold',
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
                'text-lg font-semibold tabular-nums',
              isLiability
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
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/20 dark:hover:bg-white/[0.03]"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${acc.color || '#0078D4'}15`,
                  }}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{
                      color: acc.color || '#0078D4',
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {acc.name}
                  </div>

                  <div className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {acc.type?.replace('_', ' ') || 'Account'}
                  </div>
                </div>

                {/* Neutral Amount Color */}
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums text-foreground">
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

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-28 md:px-6 md:py-6">
        
        {/* Net Worth Card */}
        <section className="mb-6 rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl p-5 shadow-md md:p-6">
          
          <div className="flex flex-col items-center justify-center text-center">
            
            {/* Title */}
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground" />

              <div className="text-sm font-semibold text-foreground">
                Net Worth
              </div>
            </div>

            {/* Amount */}
            <div
              className={cn(
                'mt-3 flex items-center justify-center gap-1 text-2xl font-bold tracking-tight tabular-nums ',
                netWorth >= 0 ? 'text-foreground' : 'text-destructive'
              )}
            >
              {netWorth < 0 && <span>-</span>}
              <InlineMoney>{formatCurrency(Math.abs(netWorth))}</InlineMoney>
            </div>

            {/* Subtext */}
            <p className="mt-2 text-sm text-muted-foreground">
              The current equilibrium of your efforts
            </p>
          </div>

          {/* Bottom Cards */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
            
            {/* Assets */}
            <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl p-4 shadow-sm">
              
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="h-4 w-4" />
                <span>Assets</span>
              </div>

              <div className="text-lg font-semibold tabular-nums text-foreground">
                <InlineMoney>{formatCurrency(totalAssets)}</InlineMoney>
              </div>

              <div className="mt-1 text-xs text-muted-foreground">
                {assets.length} {assets.length === 1 ? 'account' : 'accounts'}
              </div>
            </div>

            {/* Liabilities */}
            <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl p-4 shadow-sm">
              
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
                <ArrowDownRight className="h-4 w-4" />
                <span>Liabilities</span>
              </div>

              <div className="text-lg font-semibold tabular-nums text-foreground">
                <InlineMoney>{formatCurrency(totalLiabilities)}</InlineMoney>
              </div>

              <div className="mt-1 text-xs text-muted-foreground">
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