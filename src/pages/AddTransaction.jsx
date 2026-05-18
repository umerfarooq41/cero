import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Trash2,
} from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import TransactionTypeTabs from '@/components/shared/TransactionTypeTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { useQueryClient } from '@tanstack/react-query';
import { accountsApi, transactionsApi } from '@/lib/budgetData';
import { toast } from 'sonner';

import {
  useCategories,
  useAccounts,
  useAllTransactions,
} from '@/hooks/useBudgetData';

import { useCurrency } from '@/hooks/useCurrency';
import { usePageEntrance } from '@/hooks/usePageTransition';
import {
  getCurrencyCode as getSharedCurrencyCode,
  getCurrencySymbol as getSharedCurrencySymbol,
} from '@/lib/currencies';

const typeOptions = [
  { value: 'income', label: 'Income', icon: ArrowDownLeft },
  { value: 'expense', label: 'Expense', icon: ArrowUpRight },
  { value: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
];

const getCurrencyCode = (currency) => getSharedCurrencyCode(currency);

const getCurrencySymbol = (currency) => getSharedCurrencySymbol(currency);

function CurrencyPrefix({ currency }) {
  const currencyCode = getCurrencyCode(currency);

  if (currencyCode === 'SAR') {
    return (
      <span
        className="inline-block h-[0.72em] w-[0.72em] shrink-0 bg-current opacity-80"
        style={{
          WebkitMask: 'url(/sar.svg) center / contain no-repeat',
          mask: 'url(/sar.svg) center / contain no-repeat',
        }}
      />
    );
  }

  return <span className="text-[0.75em] leading-none">{getCurrencySymbol(currency)}</span>;
}

function normalizeCategoryType(value) {
  const normalized = String(value || '').toLowerCase().trim();

  if (normalized === 'saving') return 'savings';
  if (normalized === 'liability') return 'debt';

  return normalized;
}

function addDelta(deltas, accountId, amount) {
  if (!accountId || !amount) return;
  deltas[accountId] = (deltas[accountId] || 0) + amount;
}

function getTransactionDeltas(transaction, accounts) {
  const deltas = {};
  const amount = Number(transaction.amount) || 0;

  const source = accounts.find((a) => a.id === transaction.account_id);
  const destination = accounts.find((a) => a.id === transaction.to_account_id);

  if (source) {
    const sourceDelta =
      transaction.type === 'income'
        ? source.category === 'liability'
          ? -amount
          : amount
        : source.category === 'liability'
          ? amount
          : -amount;

    addDelta(deltas, source.id, sourceDelta);
  }

  if (transaction.type === 'transfer' && destination) {
    const destinationDelta =
      destination.category === 'liability' ? -amount : amount;

    addDelta(deltas, destination.id, destinationDelta);
  }

  return deltas;
}

function getAccountType(account) {
  return account?.type || account?.account_type || '';
}

function isDebtAccount(account) {
  const accountType = getAccountType(account);

  return (
    account?.category === 'liability' ||
    accountType === 'credit_card' ||
    accountType === 'loan' ||
    accountType === 'debt'
  );
}

function isSavingsAccount(account) {
  const accountType = getAccountType(account);

  return accountType === 'savings' || accountType === 'investment';
}

export default function AddTransaction() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditing = Boolean(id);
  const queryClient = useQueryClient();

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: allTransactions = [] } = useAllTransactions();

  const existingTransaction = allTransactions.find((t) => t.id === id);
  const currency = useCurrency();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existingTransaction) return;

    setAmount(String(existingTransaction.amount ?? ''));
    setType(existingTransaction.type || 'expense');
    setCategoryId(existingTransaction.category_id || '');
    setAccountId(existingTransaction.account_id || '');
    setToAccountId(existingTransaction.to_account_id || '');
    setDate(existingTransaction.date || format(new Date(), 'yyyy-MM-dd'));
    setNote(existingTransaction.note || '');
  }, [existingTransaction]);

  const selectedFromAccount = accounts.find((a) => a.id === accountId);
  const selectedToAccount = accounts.find((a) => a.id === toAccountId);

  const getTransferCategoryType = () => {
    if (type !== 'transfer') return null;

    const involvesDebt =
      isDebtAccount(selectedFromAccount) || isDebtAccount(selectedToAccount);

    if (involvesDebt) return 'debt';

    const involvesSavings =
      isSavingsAccount(selectedFromAccount) ||
      isSavingsAccount(selectedToAccount);

    if (involvesSavings) return 'savings';

    return null;
  };

  const transferCategoryType = getTransferCategoryType();

  const filteredCategories = categories.filter((category) => {
    const categoryType = normalizeCategoryType(category.type);

    if (type === 'expense') return categoryType === 'expense';
    if (type === 'income') return categoryType === 'income';

    if (type === 'transfer') {
      if (!transferCategoryType) return false;
      return categoryType === transferCategoryType;
    }

    return false;
  });

  useEffect(() => {
    if (!categoryId) return;

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const selectedCategoryType = normalizeCategoryType(selectedCategory?.type);

    if (type === 'expense' && selectedCategoryType !== 'expense') {
      setCategoryId('');
    }

    if (type === 'income' && selectedCategoryType !== 'income') {
      setCategoryId('');
    }

    if (
      type === 'transfer' &&
      transferCategoryType &&
      selectedCategoryType !== transferCategoryType
    ) {
      setCategoryId('');
    }

    if (type === 'transfer' && !transferCategoryType) {
      setCategoryId('');
    }
  }, [type, transferCategoryType, categoryId, categories]);

  const shouldShowCategory =
    type !== 'transfer' || Boolean(transferCategoryType);

  const categoryPlaceholder =
    type === 'transfer' && !transferCategoryType
      ? 'No category needed'
      : 'Select category';

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (!accountId) {
      toast.error(
        type === 'transfer' ? 'Select a source account' : 'Select an account'
      );
      return;
    }

    if (type === 'transfer' && !toAccountId) {
      toast.error('Select a destination account');
      return;
    }

    if (type === 'transfer' && accountId === toAccountId) {
      toast.error('Choose two different accounts for a transfer');
      return;
    }

    if (type !== 'transfer' && !categoryId) {
      toast.error('Select a category');
      return;
    }

    if (type === 'transfer' && transferCategoryType && !categoryId) {
      toast.error('Select a category');
      return;
    }

    setSaving(true);

    try {
      const parsedAmount = parseFloat(amount);

      if (isEditing && !existingTransaction) {
        toast.error('Transaction not found');
        return;
      }

      const data = {
        amount: parsedAmount,
        type,
        date,
        note: note || null,
        category_id: categoryId || null,
        account_id: accountId || null,
        to_account_id: type === 'transfer' ? toAccountId || null : null,
      };

      if (isEditing) {
        await transactionsApi.update(id, data);
      } else {
        await transactionsApi.create(data);
      }

      const newDeltas = getTransactionDeltas(data, accounts);

      const oldDeltas =
        isEditing && existingTransaction
          ? getTransactionDeltas(existingTransaction, accounts)
          : {};

      const allAccountIds = new Set([
        ...Object.keys(newDeltas),
        ...Object.keys(oldDeltas),
      ]);

      const balanceUpdates = [...allAccountIds].map((changedAccountId) => {
        const account = accounts.find((a) => a.id === changedAccountId);

        if (!account) return Promise.resolve();

        const delta =
          (newDeltas[changedAccountId] || 0) -
          (oldDeltas[changedAccountId] || 0);

        return accountsApi.update(changedAccountId, {
          balance: (Number(account.balance) || 0) + delta,
        });
      });

      await Promise.all(balanceUpdates);

      refreshData();

      toast.success(isEditing ? 'Transaction updated' : 'Transaction added');
      navigate('/transactions');
    } catch (error) {
      console.error('Transaction save failed:', error);
      toast.error(error.message || 'Could not save transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !id) return;

    if (!existingTransaction) {
      toast.error('Transaction not found');
      return;
    }

    setSaving(true);

    try {
      const oldDeltas = getTransactionDeltas(existingTransaction, accounts);

      const balanceUpdates = Object.keys(oldDeltas).map((changedAccountId) => {
        const account = accounts.find((a) => a.id === changedAccountId);

        if (!account) return Promise.resolve();

        return accountsApi.update(changedAccountId, {
          balance: (Number(account.balance) || 0) - oldDeltas[changedAccountId],
        });
      });

      await Promise.all(balanceUpdates);

      await transactionsApi.delete(id);

      refreshData();

      toast.success('Transaction deleted');
      navigate('/transactions');
    } catch (error) {
      console.error('Transaction delete failed:', error);
      toast.error(error.message || 'Could not delete transaction');
    } finally {
      setSaving(false);
    }
  };

  const amountWidth = `${Math.max(4, String(amount || '0.00').length)}ch`;

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        title={isEditing ? 'Edit Transaction' : 'Add Transaction'}
        subtitle={
          isEditing
            ? 'Update transaction details'
            : 'Record income, spending, transfers, or debt activity'
        }
      />

      <main className="mx-auto w-full max-w-3xl px-4 py-4 pb-24 lg:py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="animate-child mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="animate-child mb-6 rounded-3xl border border-border/60 bg-card/75 p-6 shadow-md backdrop-blur-xl md:p-8">
  <div className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
    Amount
  </div>

  <div className="flex justify-center overflow-hidden">
    <div className="inline-flex max-w-full items-center gap-3 text-5xl font-bold leading-none text-foreground tabular-nums">
      <CurrencyPrefix currency={currency} />

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        step="0.01"
        min="0"
        autoFocus
        inputMode="decimal"
        className="
          min-w-[4ch]
          max-w-[8ch]
          border-none
          bg-transparent
          p-0
          text-left
          text-5xl
          font-bold
          leading-none
          tabular-nums
          text-foreground
          outline-none
          placeholder:text-muted-foreground/30
        "
        style={{
          width: `${Math.min(
            8,
            Math.max(4, String(amount || '0.00').length)
          )}ch`,
        }}
      />
    </div>
  </div>
</div>

        <TransactionTypeTabs
          value={type}
          options={typeOptions}
          onChange={(nextType) => {
            setType(nextType);
            setCategoryId('');
            setToAccountId('');
          }}
          className="mb-6 animate-child"
        />

        <div className="animate-child space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {type === 'transfer' ? 'From Account' : 'Account'}
            </label>

            <Select
              value={accountId}
              onValueChange={(value) => {
                setAccountId(value);

                if (type === 'transfer') {
                  setCategoryId('');

                  if (value === toAccountId) {
                    setToAccountId('');
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>

              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === 'transfer' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                To Account
              </label>

              <Select
                value={toAccountId}
                onValueChange={(value) => {
                  setToAccountId(value);
                  setCategoryId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>

                <SelectContent>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {shouldShowCategory && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Category
              </label>

              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={type === 'transfer' && !transferCategoryType}
              >
                <SelectTrigger>
                  <SelectValue placeholder={categoryPlaceholder} />
                </SelectTrigger>

                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.color || '#0078D4' }}
                        />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {type === 'transfer' &&
                transferCategoryType &&
                filteredCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No matching {transferCategoryType} categories found.
                  </p>
                )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Date
            </label>

            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Note
            </label>

            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="h-20 resize-none"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={saving || !amount}
          className="animate-child mt-6 h-12 w-full rounded-xl text-sm font-semibold"
        >
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Transaction'}
        </Button>

        {isEditing && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                className="animate-child mt-3 h-12 w-full rounded-xl border-destructive/30 text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Transaction
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete transaction?</AlertDialogTitle>

                <AlertDialogDescription>
                  This action cannot be undone. The transaction will be
                  permanently deleted and the account balance will be adjusted.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={saving}>
                  Cancel
                </AlertDialogCancel>

                <AlertDialogAction
                  disabled={saving}
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </main>
    </div>
  );
}