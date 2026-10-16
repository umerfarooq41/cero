import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Building,
  Landmark,
  CreditCard,
  Banknote,
  PiggyBank,
  Wallet,
  ChevronDown,
  Plus,
  Settings,
  WifiOff,
} from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import NetWorthDelta from '@/components/shared/NetWorthDelta';
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
      tone: 'text-purple-600 dark:text-purple-400',
      iconClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <section className="grid grid-cols-3 divide-x divide-border/40 overflow-hidden rounded-2xl app-card-surface">
      {items.map(({ label, value, Icon, tone, iconClass }) => (
        <div key={label} className="flex min-w-0 flex-col items-center justify-center px-1.5 py-2.5 text-center sm:px-3">
          <div className="mb-1.5 flex flex-col items-center gap-1">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                iconClass
              )}
            >
              <Icon className="h-4 w-4" />
            </span>

            <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
              {label}
            </span>
          </div>

          <div className={cn('flex min-w-0 justify-center text-[12px] font-semibold tabular-nums sm:text-base', tone)}>
            <InlineMoney>{formatCurrency(Math.abs(value))}</InlineMoney>
          </div>
        </div>
      ))}
    </section>
  );
}

export default function Accounts() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const header = <PageHeader title="Financial overview" action={<div className="flex items-center gap-1">
    <button type="button" aria-label="Add account" onClick={() => navigate("/add-account")} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60"><Plus className="size-[19px]" /></button>
    {!navigator.onLine && <WifiOff className="size-[18px] text-muted-foreground" aria-label="Offline"/>}
    <button type="button" aria-label="Settings" onClick={() => navigate("/settings")} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60"><Settings className="size-[19px]" /></button>
  </div>} />;
  const formatCurrency = useCurrencyFormatter();
  const {
    data: accounts = [],
    isPending: accountsPending,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useAccounts();

  const [collapsedGroups, setCollapsedGroups] = useState({
    assets: false,
    liabilities: false,
  });

  if (accountsPending) {
    return (
      <div ref={scope} className="min-h-screen bg-transparent">
        {header}
        <main className="mx-auto flex min-h-[50vh] w-full max-w-7xl items-center justify-center px-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </main>
      </div>
    );
  }

  if (accountsError) {
    return (
      <div ref={scope} className="min-h-screen bg-transparent">
        {header}
        <main className="mx-auto flex min-h-[50vh] w-full max-w-7xl flex-col items-center justify-center gap-3 px-4 text-center">
          <h2 className="text-lg font-semibold">Couldn't load accounts</h2>
          <p className="text-sm text-muted-foreground">Your data has not been changed. Check your connection and try again.</p>
          <button type="button" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => refetchAccounts()}>
            Retry
          </button>
        </main>
      </div>
    );
  }

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
          className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-3 py-2.5 text-left transition-colors hover:bg-accent/30"
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
                  className="flex min-h-[3.75rem] items-center gap-2.5 px-3 py-2 transition-colors hover:bg-accent/20"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
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

                    <div className="mt-0.5 truncate text-[11px] capitalize leading-tight text-muted-foreground">
                      {typeLabel} · {isLiability ? 'Liability' : 'Asset'}
                    </div>
                  </div>

                  <div className="flex min-w-0 shrink-0 items-center justify-end text-right">
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
      {header}

      <main className="mx-auto w-full max-w-7xl px-4 py-3 pb-28 md:px-6 md:py-5">
        <div className="animate-child mb-3">
          <NetWorthDelta
            netWorth={netWorth}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="animate-child mb-3">
          <AccountSummaryCard
            cashAvailable={cashAvailable}
            savingsTotal={savingsTotal}
            debtTotal={totalLiabilities}
            formatCurrency={formatCurrency}
          />
        </div>

        <div className="animate-child space-y-3">
          {renderGroup('Assets', assets, false)}
          {renderGroup('Liabilities', liabilities, true)}
        </div>

      </main>
    </div>
  );
}
