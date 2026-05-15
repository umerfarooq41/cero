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
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
        <div className="surface-card card-elevated rounded-2xl border border-white/40 dark:border-white/[0.05] p-6 mb-8 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Net Worth
          </div>

          <div
            className={cn(
              'text-4xl font-bold tracking-tight mb-4 tabular-nums flex items-center justify-center gap-1',
              netWorth >= 0 ? 'text-foreground' : 'text-destructive'
            )}
          >
            {netWorth < 0 && <span>-</span>}
            <InlineMoney>{formatCurrency(Math.abs(netWorth))}</InlineMoney>
          </div>

          <div className="text-xs text-muted-foreground flex items-center justify-center gap-x-1.5 gap-y-1 flex-wrap">
            <span>Assets</span>
            <InlineMoney>{formatCurrency(totalAssets)}</InlineMoney>
            <span>−</span>
            <span>Liabilities</span>
            <InlineMoney>{formatCurrency(totalLiabilities)}</InlineMoney>
          </div>
        </div>

        <div className="space-y-4">
          {renderGroup('Assets', assets, false)}
          {renderGroup('Liabilities', liabilities, true)}
        </div>

        <Link to="/add-account">
          <Button
            className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-2xl shadow-lg shadow-primary/25 p-0 lg:bottom-6"
            size="icon"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </main>
    </div>
  );
}