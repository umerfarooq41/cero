import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Banknote,
  Building,
  ChevronDown,
  CreditCard,
  Landmark,
  Plus,
  TrendingUp,
  Wallet,
  PiggyBank,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAccounts, useCurrencyFormatter } from '@/hooks/useBudgetData';
import { cn } from '@/lib/utils';
import {
  GlassCard,
  MoneyAmount,
  PageHeader,
  SectionCard,
  TonePill,
} from '@/components/shared/Premium';

const typeIcons = {
  checking: Landmark,
  savings: PiggyBank,
  credit_card: CreditCard,
  cash: Banknote,
  investment: TrendingUp,
  loan: Building,
  other: Wallet,
};

function AccountRow({ account, isLiability, formatCurrency }) {
  const Icon = typeIcons[account.type] || Wallet;
  const balance = Math.abs(Number(account.balance) || 0);

  return (
    <Link
      to={`/accounts/${account.id}`}
      className="group flex items-center gap-3 rounded-[1.1rem] px-3 py-3 transition-colors hover:bg-foreground/[0.04] dark:hover:bg-secondary/70"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${account.color || '#0078D4'}1F` }}
      >
        <Icon className="h-5 w-5" style={{ color: account.color || '#0078D4' }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{account.name}</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
            {account.type?.replace('_', ' ') || 'Account'}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {isLiability ? 'Liability' : 'Asset'}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'shrink-0 text-right text-sm font-bold tabular-nums',
          isLiability ? 'text-red-600 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'
        )}
      >
        <MoneyAmount>
          {isLiability && <span>-</span>}
          {formatCurrency(balance)}
        </MoneyAmount>
      </div>
    </Link>
  );
}

function AccountSection({
  title,
  accounts,
  total,
  tone,
  isLiability,
  defaultOpen = true,
  formatCurrency,
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (accounts.length === 0) return null;

  return (
    <SectionCard
      title={title}
      description={`${accounts.length} account${accounts.length === 1 ? '' : 's'}`}
      tone={tone}
      action={
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition hover:text-foreground"
          aria-label={`Toggle ${title}`}
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', !open && '-rotate-90')} />
        </button>
      }
      bodyClassName="p-2"
    >
      <div className="mb-2 flex items-center justify-between px-3 pt-1 text-xs text-muted-foreground">
        <span>Total</span>
        <span className="font-semibold tabular-nums">
          <MoneyAmount>{formatCurrency(total)}</MoneyAmount>
        </span>
      </div>

      {open && (
        <div className="space-y-1">
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              account={account}
              isLiability={isLiability}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default function Accounts() {
  const formatCurrency = useCurrencyFormatter();
  const { data: accounts = [] } = useAccounts();

  const assets = accounts.filter((account) => account.category === 'asset');
  const liabilities = accounts.filter((account) => account.category === 'liability');

  const totalAssets = assets.reduce((sum, account) => sum + (Number(account.balance) || 0), 0);
  const totalLiabilities = liabilities.reduce(
    (sum, account) => sum + Math.abs(Number(account.balance) || 0),
    0
  );
  const netWorth = totalAssets - totalLiabilities;
  const gross = totalAssets + totalLiabilities;
  const assetShare = gross > 0 ? Math.round((totalAssets / gross) * 100) : 0;
  const liabilityShare = gross > 0 ? 100 - assetShare : 0;

  const healthText =
    netWorth >= 0
      ? liabilities.length > 0
        ? 'Assets are carrying your liabilities with room to plan forward.'
        : 'Clean balance sheet. Your accounts are fully asset-weighted.'
      : 'Liabilities are ahead right now. Focus your next budget pass on debt reduction.';

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 pb-nav sm:px-6 lg:py-10">
      <PageHeader
        title="Accounts"
        description="Assets, liabilities, and net worth in one clean view."
        icon={Wallet}
        actions={
          <Link to="/add-account">
            <Button size="sm" className="h-10 rounded-full px-4 shadow-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </Link>
        }
      />

      <GlassCard tone="default" className="p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-stretch">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <TonePill tone="analytics">
                Net worth
              </TonePill>
              <TonePill tone={netWorth >= 0 ? 'income' : 'debt'}>
                <BadgeCheck className="h-3.5 w-3.5" />
                {netWorth >= 0 ? 'Positive' : 'Recovery mode'}
              </TonePill>
            </div>

            <div
              className={cn(
                'flex items-center gap-1 text-[2rem] font-semibold leading-tight tracking-[-0.02em] sm:text-[2.5rem]',
                netWorth >= 0 ? 'text-violet-700 dark:text-violet-200' : 'text-red-700 dark:text-red-300'
              )}
            >
              <MoneyAmount>
                {netWorth < 0 && <span>-</span>}
                {formatCurrency(Math.abs(netWorth))}
              </MoneyAmount>
            </div>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              {healthText}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.25rem] border border-emerald-500/15 bg-emerald-500/10 p-3">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                Assets
              </p>
              <div className="mt-2 text-lg font-semibold">
                <MoneyAmount>{formatCurrency(totalAssets)}</MoneyAmount>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {assets.length} account{assets.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-red-500/15 bg-red-500/10 p-3">
              <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                Liabilities
              </p>
              <div className="mt-2 text-lg font-semibold">
                <MoneyAmount>{formatCurrency(totalLiabilities)}</MoneyAmount>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {liabilities.length} account{liabilities.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-full bg-secondary/70 p-1">
          <div className="flex h-3 overflow-hidden rounded-full">
            <div
              className="bg-emerald-500 transition-all duration-700"
              style={{ width: `${assetShare}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-700"
              style={{ width: `${liabilityShare}%` }}
            />
          </div>
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-medium text-muted-foreground">
          <span>{assetShare}% assets</span>
          <span>{liabilityShare}% liabilities</span>
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AccountSection
          title="Assets"
          accounts={assets}
          total={totalAssets}
          tone="income"
          formatCurrency={formatCurrency}
        />
        <AccountSection
          title="Liabilities"
          accounts={liabilities}
          total={totalLiabilities}
          tone="debt"
          isLiability
          defaultOpen={liabilities.length > 0}
          formatCurrency={formatCurrency}
        />
      </div>

      {accounts.length === 0 && (
        <GlassCard className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-primary/10 text-primary">
            <Wallet className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">Start with one account</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Add checking, cash, savings, loans, or cards to build your net worth view.
          </p>
          <Link to="/add-account">
            <Button className="mt-5 rounded-2xl">Add Account</Button>
          </Link>
        </GlassCard>
      )}

      <Link to="/add-account" className="fixed bottom-24 right-5 z-40 sm:bottom-28 sm:right-8">
        <Button
          className="h-14 w-14 rounded-2xl p-0 shadow-md"
          size="icon"
          aria-label="Add account"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
