import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Building,
  Landmark,
  CreditCard,
  Banknote,
  PiggyBank,
  Wallet,
  ChevronDown,
} from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import NetWorthDelta from '@/components/shared/NetWorthDelta';
import FloatingActionButton from '@/components/shared/FloatingActionButton';
import { useAccounts, useCurrencyFormatter } from '@/hooks/useBudgetData';
import { cn } from '@/lib/utils';
import { usePageEntrance } from '@/hooks/usePageTransition';

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
    <span className="inline-flex items-center align-middle whitespace-nowrap tabular-nums">
      {children}
    </span>
  );
}

function normalizeType(type = '') {
  return String(type).toLowerCase().replace(/\s+/g, '_');
}

function AccountSummaryCard({ cashAvailable, savingsTotal, debtTotal, formatCurrency }) {
  const items = [
    {
      label: 'Available',
      value: cashAvailable,
      Icon: Banknote,
      tone: 'text-emerald-600 dark:text-emerald-400',
      iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Savings',
      value: savingsTotal,
      Icon: PiggyBank,
      tone: 'text-blue-600 dark:text-blue-400',
      iconClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Debt',
      value: debtTotal,
      Icon: CreditCard,
      tone: 'text-red-600 dark:text-red-400',
      iconClass: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
  ];

  return (
    <section className="grid grid-cols-3 divide-x divide-border/40 overflow-hidden rounded-2xl app-card-surface">
      {items.map(({ label, value, Icon, tone, iconClass }) => (
        <div key={label} className="min-w-0 px-3 py-3.5 sm:px-4">
          <div className="mb-2 flex items-center gap-2">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl',
                iconClass
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>

            <span className="min-w-0 truncate text-[11px] font-medium text-muted-foreground sm:text-xs">
              {label}
            </span>
          </div>

          <div className={cn('text-sm font-bold tabular-nums sm:text-base', tone)}>
            <InlineMoney>{formatCurrency(Math.abs(value))}</InlineMoney>
          </div>
        </div>
      ))}
    </section>
  );
}

export default function Accounts() {
  const scope = usePageEntrance();
  const formatCurrency = useCurrencyFormatter();
  const { data: accounts = [] } = useAccounts();

  const [collapsedGroups, setCollapsedGroups] = useState({
    assets: false,
    liabilities: false,
  });

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

  const cashAvailable = assets.reduce((sum, account) => {
    const type = normalizeType(account.type);

    if (type === 'checking' || type === 'cash') {
      return sum + (Number(account.balance) || 0);
    }

    return sum;
  }, 0);

  const savingsTotal = assets.reduce((sum, account) => {
    return normalizeType(account.type) === 'savings'
      ? sum + (Number(account.balance) || 0)
      : sum;
  }, 0);

  const netWorth = totalAssets - totalLiabilities;

  const toggleGroup = (key) => {
    setCollapsedGroups((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const renderGroup = (title, accs, isLiability) => {
    if (accs.length === 0) return null;

    const groupKey = isLiability ? 'liabilities' : 'assets';
    const isCollapsed = collapsedGroups[groupKey];

    const total = accs.reduce(
      (sum, account) => sum + Math.abs(Number(account.balance) || 0),
      0
    );

    return (
      <section className="overflow-hidden rounded-2xl app-card-surface">
        <button
          type="button"
          onClick={() => toggleGroup(groupKey)}
          className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-4 py-3.5 text-left transition-colors hover:bg-accent/30"
        >
          <div className="flex min-w-0 items-center gap-2">
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                isCollapsed && '-rotate-90'
              )}
            />

            <h3
              className={cn(
                'truncate text-sm font-semibold',
                isLiability
                  ? 'text-destructive'
                  : 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {title}
            </h3>

            <span
              className={cn(
                'flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none tabular-nums',
                isLiability
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              )}
            >
              {accs.length}
            </span>
          </div>

          <div
            className={cn(
              'shrink-0 text-right text-sm font-bold tabular-nums sm:text-base',
              isLiability
                ? 'text-destructive'
                : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            <InlineMoney>{formatCurrency(total)}</InlineMoney>
          </div>
        </button>

        {!isCollapsed && (
          <div className="divide-y divide-border/40">
            {accs.map((account) => {
              const Icon = typeIcons[account.type] || Wallet;
              const balance = Math.abs(Number(account.balance) || 0);
              const accountColor = account.color || '#0078D4';
              const typeLabel = account.type?.replace('_', ' ') || 'Account';

              return (
                <Link
                  key={account.id}
                  to={`/accounts/${account.id}`}
                  className="flex min-h-[4.75rem] items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/20"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${accountColor}15`,
                    }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{
                        color: accountColor,
                      }}
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <div className="truncate text-sm font-medium leading-tight text-foreground">
                      {account.name}
                    </div>

                    <div className="mt-1 truncate text-xs capitalize leading-none text-muted-foreground">
                      {typeLabel} · {isLiability ? 'Liability' : 'Asset'}
                    </div>
                  </div>

                  <div className="flex min-w-[5.75rem] shrink-0 items-center justify-end self-stretch text-right">
                    <div
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        isLiability ? 'text-destructive' : 'text-foreground'
                      )}
                    >
                      <InlineMoney>{formatCurrency(balance)}</InlineMoney>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader title="Accounts" subtitle="Your financial overview" />

      <main className="mx-auto w-full max-w-7xl px-4 py-4 pb-28 md:px-6 md:py-6">
        <div className="animate-child mb-4">
          <NetWorthDelta
            netWorth={netWorth}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="animate-child mb-6">
          <AccountSummaryCard
            cashAvailable={cashAvailable}
            savingsTotal={savingsTotal}
            debtTotal={totalLiabilities}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="animate-child space-y-4">
          {renderGroup('Assets', assets, false)}
          {renderGroup('Liabilities', liabilities, true)}
        </div>

        <FloatingActionButton to="/add-account" ariaLabel="Add account" />
      </main>
    </div>
  );
}
