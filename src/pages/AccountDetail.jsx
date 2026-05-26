import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PencilLine,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useAccounts,
  useAllTransactions,
  useCategories,
  useSavingsGoals,
} from '@/hooks/useBudgetData';

import TransactionRow from '@/components/transactions/TransactionRow';
import EmptyState from '@/components/shared/EmptyState';

import { useQueryClient } from '@tanstack/react-query';
import { accountsApi, transactionsApi } from '@/lib/budgetData';
import {
  deleteTransactionWithEffects,
  getTransactionDeltas,
} from '@/lib/transactionEffects';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
import { usePageEntrance } from '@/hooks/usePageTransition';
import {
  getCurrencyCode as getSharedCurrencyCode,
  getCurrencySymbol as getSharedCurrencySymbol,
  formatCurrencyNumberText,
} from '@/lib/currencies';

const getCurrencyCode = (currency) => getSharedCurrencyCode(currency);

const getCurrencySymbol = (currency) => getSharedCurrencySymbol(currency);

function formatNumber(value = 0) {
  const number = Number(value || 0);

  return formatCurrencyNumberText(number);
}

function CurrencyAmount({ amount, currency, compact = false, className = '' }) {
  const code = getCurrencyCode(currency);
  const symbol = getCurrencySymbol(currency);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 align-middle whitespace-nowrap leading-none text-current tabular-nums',
        className
      )}
    >
      {code === 'SAR' ? (
        <span
          className={cn(
            'inline-block shrink-0 bg-current align-middle',
            compact ? 'h-[0.8em] w-[0.8em]' : 'h-[0.9em] w-[0.9em]'
          )}
          style={{
            WebkitMask: 'url(/sar.svg) center / contain no-repeat',
            mask: 'url(/sar.svg) center / contain no-repeat',
          }}
        />
      ) : (
        <span className="text-current">{symbol}</span>
      )}

      <span className="tabular-nums">{formatNumber(amount)}</span>
    </span>
  );
}

function getExplicitStartingBalance(account) {
  const value =
    account?.starting_balance ??
    account?.opening_balance ??
    account?.initial_balance;

  if (value === undefined || value === null || value === '') return null;

  return Number(value) || 0;
}

function getDerivedStartingBalance({ account, accountId, accountTransactions, accounts }) {
  const explicitStartingBalance = getExplicitStartingBalance(account);

  if (explicitStartingBalance !== null) {
    return explicitStartingBalance;
  }

  const currentBalance = Number(account?.balance) || 0;
  const transactionDelta = accountTransactions.reduce((sum, transaction) => {
    const deltas = getTransactionDeltas(transaction, accounts);
    return sum + (Number(deltas[accountId]) || 0);
  }, 0);

  return currentBalance - transactionDelta;
}

function AccountBalanceHero({ account, startingBalance, balance, isLiability, formatCurrency }) {
  const typeLabel = account.type?.replace('_', ' ') || 'Account';
  const categoryLabel = account.category || 'asset';

  return (
    <section className="animate-child mb-6 overflow-hidden rounded-3xl app-card-surface shadow-md">
      <div
        className={cn(
          'p-5 sm:p-6',
          isLiability
            ? 'bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent'
            : 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent'
        )}
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Current Balance
        </div>

        <div
          className={cn(
            'mt-2 flex items-center gap-1 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl',
            isLiability ? 'text-red-600 dark:text-red-400' : 'text-foreground'
          )}
        >
          {isLiability && <span>-</span>}
          {formatCurrency(balance)}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm">
          <span className="capitalize">{typeLabel}</span>
          <span>·</span>
          <span className="capitalize">{categoryLabel}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            Starting balance
            <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
              {isLiability && <span>-</span>}
              {formatCurrency(Math.abs(startingBalance))}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

export default function AccountDetail() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currency = useCurrency();
  const formatCurrency = (amount) => (
    <CurrencyAmount amount={amount} currency={currency} compact />
  );

  const accountId = window.location.pathname.split('/').pop();

  const { data: accounts = [] } = useAccounts();
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: categories = [] } = useCategories();
  const { data: savingsGoals = [] } = useSavingsGoals();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [replacementAccountId, setReplacementAccountId] = useState('');
  const [deleting, setDeleting] = useState(false);

  const account = accounts.find((a) => a.id === accountId);

  const accountTransactions = allTransactions.filter(
    (t) => t.account_id === accountId || t.to_account_id === accountId
  );

  const transactions = accountTransactions.slice(0, 50);

  const replacementAccounts = accounts.filter((a) => a.id !== accountId);

  const handleDeleteTransaction = async (id) => {
    const transaction = allTransactions.find((item) => item.id === id);

    if (!transaction) {
      toast.error('Transaction not found');
      return;
    }

    try {
      await deleteTransactionWithEffects({
        transaction,
        accounts,
        savingsGoals,
      });

      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal-contributions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });

      toast.success('Transaction deleted');
    } catch (error) {
      console.error('Transaction delete failed:', error);
      toast.error(error.message || 'Could not delete transaction');
    }
  };

  const handleDeleteAccount = async () => {
    if (!account) return;

    if (accountTransactions.length > 0 && !replacementAccountId) {
      toast.error('Select another account for existing transactions');
      return;
    }

    setDeleting(true);

    try {
      if (accountTransactions.length > 0) {
        await Promise.all(
          accountTransactions.map((transaction) => {
            const payload = {};

            if (transaction.account_id === accountId) {
              payload.account_id = replacementAccountId;
            }

            if (transaction.to_account_id === accountId) {
              payload.to_account_id = replacementAccountId;
            }

            return transactionsApi.update(transaction.id, payload);
          })
        );
      }

      await accountsApi.delete(accountId);

      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });

      toast.success('Account deleted');
      navigate('/accounts');
    } catch (error) {
      console.error('Account delete failed:', error);
      toast.error(error.message || 'Could not delete account');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (!account) {
    return (
      <div ref={scope} className="min-h-screen bg-transparent">
        <PageHeader
          title="Account"
          subtitle="Account details and activity"
        />

        <main className="animate-child mx-auto w-full max-w-lg px-4 py-10 text-center">
          <p className="text-muted-foreground">Account not found</p>

          <Button
            variant="ghost"
            onClick={() => navigate('/accounts')}
            className="mt-4"
          >
            Back to Accounts
          </Button>
        </main>
      </div>
    );
  }

  const isLiability = account.category === 'liability';
  const balance = Math.abs(Number(account.balance) || 0);
  const startingBalance = getDerivedStartingBalance({
    account,
    accountId,
    accountTransactions,
    accounts,
  });

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        title={account.name}
        subtitle={`${account.type?.replace('_', ' ') || 'Account'} details and activity`}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-24 lg:py-8">
        <div className="mb-4 flex items-center justify-between gap-3 animate-child">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/accounts')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Accounts
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/accounts/${accountId}/edit`)}
              aria-label="Edit account"
            >
              <PencilLine className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="Delete account"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <AccountBalanceHero
          account={account}
          startingBalance={startingBalance}
          balance={balance}
          isLiability={isLiability}
          formatCurrency={formatCurrency}
        />

        <div className="mb-3 flex items-center justify-between animate-child">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Transactions
          </h2>

          <span className="text-xs text-muted-foreground">
            {transactions.length} shown
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="animate-child">
            <EmptyState
              title="No transactions"
              description="No transactions for this account yet."
            />
          </div>
        ) : (
          <div className="animate-child overflow-hidden rounded-2xl app-card-surface">
            <div className="divide-y divide-border/50">
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  category={categories.find(
                    (c) => c.id === transaction.category_id
                  )}
                  account={accounts.find(
                    (a) => a.id === transaction.account_id
                  )}
                  toAccount={accounts.find(
                    (a) => a.id === transaction.to_account_id
                  )}
                  formatCurrency={formatCurrency}
                  onDelete={() => handleDeleteTransaction(transaction.id)}
                  onClick={() =>
                    navigate(`/transactions/${transaction.id}/edit`)
                  }
                />
              ))}
            </div>
          </div>
        )}

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Account
              </DialogTitle>

              <p className="text-sm text-muted-foreground">
                {accountTransactions.length > 0
                  ? 'This account has transactions. Choose another account to move them before deleting.'
                  : 'This account has no transactions and can be deleted safely.'}
              </p>
            </DialogHeader>

            {accountTransactions.length > 0 && (
              <div className="space-y-2 py-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Move transactions to
                </label>

                <Select
                  value={replacementAccountId}
                  onValueChange={setReplacementAccountId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select another account" />
                  </SelectTrigger>

                  <SelectContent>
                    {replacementAccounts.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-xs text-muted-foreground">
                  {accountTransactions.length} transaction
                  {accountTransactions.length > 1 ? 's' : ''} will be reassigned.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={
                  deleting ||
                  (accountTransactions.length > 0 && !replacementAccountId)
                }
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
