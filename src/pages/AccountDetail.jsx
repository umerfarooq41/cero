import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PencilLine,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

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
  useCurrencyFormatter,
} from '@/hooks/useBudgetData';

import TransactionRow from '@/components/transactions/TransactionRow';
import EmptyState from '@/components/shared/EmptyState';

import { useQueryClient } from '@tanstack/react-query';
import { accountsApi, transactionsApi } from '@/lib/budgetData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function InlineMoney({ children }) {
  return (
    <span className="inline-flex items-center align-middle whitespace-nowrap">
      {children}
    </span>
  );
}

export default function AccountDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formatCurrency = useCurrencyFormatter();

  const accountId = window.location.pathname.split('/').pop();

  const { data: accounts = [] } = useAccounts();
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: categories = [] } = useCategories();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [replacementAccountId, setReplacementAccountId] = useState('');
  const [deleting, setDeleting] = useState(false);

  const account = accounts.find((a) => a.id === accountId);

  const accountTransactions = allTransactions.filter(
    (t) => t.account_id === accountId || t.to_account_id === accountId
  );

  const transactions = accountTransactions.slice(0, 50);

  const replacementAccounts = accounts.filter(
    (a) => a.id !== accountId
  );

  const handleDeleteTransaction = async (id) => {
    try {
      await transactionsApi.delete(id);

      queryClient.invalidateQueries({
        queryKey: ['all-transactions'],
      });

      queryClient.invalidateQueries({
        queryKey: ['transactions'],
      });

      toast.success('Transaction deleted');
    } catch (error) {
      console.error('Transaction delete failed:', error);

      toast.error(
        error.message || 'Could not delete transaction'
      );
    }
  };

  const handleDeleteAccount = async () => {
    if (!account) return;

    if (
      accountTransactions.length > 0 &&
      !replacementAccountId
    ) {
      toast.error(
        'Select another account for existing transactions'
      );
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

            return transactionsApi.update(
              transaction.id,
              payload
            );
          })
        );
      }

      await accountsApi.delete(accountId);

      queryClient.invalidateQueries({
        queryKey: ['accounts'],
      });

      queryClient.invalidateQueries({
        queryKey: ['transactions'],
      });

      queryClient.invalidateQueries({
        queryKey: ['all-transactions'],
      });

      toast.success('Account deleted');

      navigate('/accounts');
    } catch (error) {
      console.error('Account delete failed:', error);

      toast.error(
        error.message || 'Could not delete account'
      );
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <p className="text-muted-foreground">
          Account not found
        </p>

        <Button
          variant="ghost"
          onClick={() => navigate('/accounts')}
          className="mt-4"
        >
          Back to Accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 lg:py-10">
      <div className="flex items-center gap-3 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/accounts')}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">
            {account.name}
          </h1>

          <p className="text-xs text-muted-foreground capitalize">
            {account.type?.replace('_', ' ') || 'Account'}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            navigate(`/accounts/${accountId}/edit`)
          }
        >
          <PencilLine className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteOpen(true)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 mb-8 text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
          Balance
        </div>

        <div
          className={cn(
            'text-4xl font-bold tracking-tight tabular-nums flex items-center justify-center gap-1',
            account.category === 'liability'
              ? 'text-destructive'
              : 'text-foreground'
          )}
        >
          {account.category === 'liability' && (
            <span>-</span>
          )}

          <InlineMoney>
            {formatCurrency(
              Math.abs(Number(account.balance) || 0)
            )}
          </InlineMoney>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Recent Transactions
      </h2>

      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions"
          description="No transactions for this account yet."
        />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border/50">
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
              onDelete={() =>
                handleDeleteTransaction(transaction.id)
              }
              onClick={() =>
                navigate(
                  `/transactions/${transaction.id}/edit`
                )
              }
            />
          ))}
        </div>
      )}

      <Dialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
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
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
                    <SelectItem
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-[11px] text-muted-foreground">
                {accountTransactions.length} transaction
                {accountTransactions.length > 1
                  ? 's'
                  : ''}{' '}
                will be reassigned.
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
                (accountTransactions.length > 0 &&
                  !replacementAccountId)
              }
            >
              {deleting
                ? 'Deleting...'
                : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}