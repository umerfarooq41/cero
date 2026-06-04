import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import PageHeader from '@/components/layout/PageHeader';
import AppTabs from '@/components/shared/AppTabs.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useAccounts,
  useAllTransactions,
  useCategories,
  useSavingsGoals,
} from '@/hooks/useBudgetData';
import { useCurrency } from '@/hooks/useCurrency';
import { accountsApi, transactionsApi } from '@/lib/budgetData';
import { deleteTransactionWithEffects } from '@/lib/transactionEffects';

const typeOptions = [
  {
    value: 'expense',
    label: 'Expense',
    icon: ArrowUpRight,
    tone: 'red',
  },
  {
    value: 'income',
    label: 'Income',
    icon: ArrowDownLeft,
    tone: 'emerald',
  },
  {
    value: 'transfer',
    label: 'Transfer',
    icon: ArrowLeftRight,
    tone: 'transfer',
  },
];

const TRANSFER_PURPOSES = {
  normal: 'normal',
  savingsAllocation: 'savings_allocation',
  debtPayment: 'debt_payment',
};

function CurrencyPrefix({ currency }) {
  const currencyCode =
    typeof currency === 'string'
      ? currency
      : currency?.code || currency?.currency || 'SAR';

  if (currencyCode === 'SAR') {
    return <img src="/sar.svg" alt="SAR" className="h-5 w-5 opacity-70" />;
  }

  return <span className="text-sm font-semibold">{currencyCode}</span>;
}

function TransactionTypeSelector({ value, onChange }) {
  return (
    <AppTabs
      tabs={typeOptions}
      value={value}
      onChange={onChange}
      size="sm"
      layoutId="add-transaction-type-tab-highlight"
      gridClassName="gap-0.5 sm:gap-1"
      buttonClassName="gap-1.5 px-2 py-2.5 text-xs sm:text-sm"
    />
  );
}

function addDelta(deltas, accountId, amount) {
  if (!accountId || !amount) return;
  deltas[accountId] = (deltas[accountId] || 0) + amount;
}

function getTransactionDeltas(transaction, accounts) {
  const deltas = {};
  const amount = Number(transaction.amount) || 0;

  const source = accounts.find((account) => account.id === transaction.account_id);
  const destination = accounts.find((account) => account.id === transaction.to_account_id);

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
    const destinationDelta = destination.category === 'liability' ? -amount : amount;
    addDelta(deltas, destination.id, destinationDelta);
  }

  return deltas;
}

function normalizeCategoryType(type) {
  if (type === 'saving') return 'savings';
  if (type === 'liability') return 'debt';
  return String(type || '').toLowerCase();
}

function isSavingsAccount(account) {
  return normalizeCategoryType(account?.type) === 'savings';
}

function isDebtAccount(account) {
  const accountType = normalizeCategoryType(account?.type);
  const accountCategory = normalizeCategoryType(account?.category);

  return (
    accountCategory === 'debt' ||
    accountCategory === 'liability' ||
    accountType === 'debt' ||
    accountType === 'loan' ||
    accountType === 'credit_card'
  );
}

function getTransferPurposeFromCategory(category) {
  const categoryType = normalizeCategoryType(category?.type);

  if (categoryType === 'savings') return TRANSFER_PURPOSES.savingsAllocation;
  if (categoryType === 'debt') return TRANSFER_PURPOSES.debtPayment;

  return TRANSFER_PURPOSES.normal;
}

export default function AddTransaction() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const queryClient = useQueryClient();

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: savingsGoals = [] } = useSavingsGoals();

  const existingTransaction = allTransactions.find((transaction) => transaction.id === id);
  const currency = useCurrency();

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferPurpose, setTransferPurpose] = useState(TRANSFER_PURPOSES.normal);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const destinationAccount = useMemo(
    () => accounts.find((account) => account.id === toAccountId),
    [accounts, toAccountId]
  );

  const transferPurposeOptions = useMemo(() => {
    const options = [
      {
        value: TRANSFER_PURPOSES.normal,
        label: 'Normal transfer',
        description: 'Move money only. Does not affect the monthly plan.',
      },
    ];

    if (isSavingsAccount(destinationAccount)) {
      options.push({
        value: TRANSFER_PURPOSES.savingsAllocation,
        label: 'Savings allocation',
        description: 'Track this transfer against a savings category.',
      });
    }

    if (isDebtAccount(destinationAccount)) {
      options.push({
        value: TRANSFER_PURPOSES.debtPayment,
        label: 'Debt payment',
        description: 'Track this transfer against a debt category.',
      });
    }

    return options;
  }, [destinationAccount]);

  const requiresCategory =
    type !== 'transfer' ||
    transferPurpose === TRANSFER_PURPOSES.savingsAllocation ||
    transferPurpose === TRANSFER_PURPOSES.debtPayment;

  useEffect(() => {
    if (!existingTransaction) return;

    const existingCategory = categories.find(
      (category) => category.id === existingTransaction.category_id
    );

    setAmount(String(existingTransaction.amount ?? ''));
    setType(existingTransaction.type || 'expense');
    setCategoryId(existingTransaction.category_id || '');
    setAccountId(existingTransaction.account_id || '');
    setToAccountId(existingTransaction.to_account_id || '');
    setTransferPurpose(
      existingTransaction.type === 'transfer'
        ? getTransferPurposeFromCategory(existingCategory)
        : TRANSFER_PURPOSES.normal
    );
    setDate(existingTransaction.date || format(new Date(), 'yyyy-MM-dd'));
    setNote(existingTransaction.note || '');
  }, [categories, existingTransaction]);

  useEffect(() => {
    if (type !== 'transfer') return;

    const currentPurposeAllowed = transferPurposeOptions.some(
      (option) => option.value === transferPurpose
    );

    if (!currentPurposeAllowed) {
      setTransferPurpose(TRANSFER_PURPOSES.normal);
      setCategoryId('');
    }
  }, [transferPurpose, transferPurposeOptions, type]);

  const filteredCategories = categories.filter((category) => {
    const categoryType = normalizeCategoryType(category.type);

    if (type === 'expense') {
      return categoryType === 'expense';
    }

    if (type === 'income') {
      return categoryType === 'income';
    }

    if (type === 'transfer') {
      if (transferPurpose === TRANSFER_PURPOSES.savingsAllocation) {
        return categoryType === 'savings';
      }

      if (transferPurpose === TRANSFER_PURPOSES.debtPayment) {
        return categoryType === 'debt';
      }
    }

    return false;
  });

  const handleSubmit = async () => {
    const parsedAmount = Number(amount || 0);

    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (!accountId) {
      toast.error(type === 'transfer' ? 'Select a source account' : 'Select an account');
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

    if (requiresCategory && !categoryId) {
      if (type === 'transfer' && transferPurpose === TRANSFER_PURPOSES.savingsAllocation) {
        toast.error('Select a savings category');
        return;
      }

      if (type === 'transfer' && transferPurpose === TRANSFER_PURPOSES.debtPayment) {
        toast.error('Select a debt category');
        return;
      }

      toast.error('Select a category');
      return;
    }

    setSaving(true);

    try {
      if (isEditing && !existingTransaction) {
        toast.error('Transaction not found');
        return;
      }

      const data = {
        amount: parsedAmount,
        type,
        date,
        note: note || null,
        category_id: requiresCategory ? categoryId || null : null,
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
        const account = accounts.find((item) => item.id === changedAccountId);
        if (!account) return Promise.resolve();

        const delta =
          (newDeltas[changedAccountId] || 0) -
          (oldDeltas[changedAccountId] || 0);

        return accountsApi.update(changedAccountId, {
          balance: (Number(account.balance) || 0) + delta,
        });
      });

      await Promise.all(balanceUpdates);

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
      queryClient.invalidateQueries({ queryKey: ['plan-data'] });

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
    if (!isEditing || !existingTransaction) {
      toast.error('Transaction not found');
      setDeleteOpen(false);
      return;
    }

    setDeleting(true);

    try {
      await deleteTransactionWithEffects({
        transaction: existingTransaction,
        accounts,
        savingsGoals,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['all-transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['savings-goals'] }),
        queryClient.invalidateQueries({ queryKey: ['goal-contributions'] }),
        queryClient.invalidateQueries({ queryKey: ['budget-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['plan-data'] }),
      ]);

      toast.success('Transaction deleted');
      setDeleteOpen(false);
      navigate('/transactions');
    } catch (error) {
      console.error('Transaction delete failed:', error);
      toast.error(error.message || 'Could not delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title={isEditing ? 'Edit Transaction' : 'Add Transaction'}
        subtitle={
          isEditing
            ? 'Update transaction details'
            : 'Record income, expenses, or transfers'
        }
        action={
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="group relative flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full text-muted-foreground/80 transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-[1.15rem] w-[1.15rem] stroke-[2.35]" />
          </button>
        }
      />

      <main className="mx-auto w-full max-w-3xl px-4 py-3 pb-24 lg:py-8">
        <div className="mb-3">
          <TransactionTypeSelector
            value={type}
            onChange={(nextType) => {
              setType(nextType);
              setCategoryId('');
              setToAccountId('');
              setTransferPurpose(TRANSFER_PURPOSES.normal);
            }}
          />
        </div>

        <div className="space-y-3.5 rounded-2xl app-card-surface p-4 sm:p-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Amount
            </label>

            <div className="flex h-14 items-center rounded-2xl border border-border/60 bg-background/80 px-4 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
              <span className="mr-3 flex shrink-0 items-center text-muted-foreground">
                <CurrencyPrefix currency={currency} />
              </span>

              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-left text-2xl font-bold tabular-nums tracking-tight text-foreground outline-none placeholder:text-muted-foreground/45 sm:text-3xl"
                step="0.01"
                min="0"
                inputMode="decimal"
                autoFocus
              />
            </div>
          </div>

          {type !== 'transfer' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Category
              </label>

              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>

                <SelectContent>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: category.color || '#0078D4' }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {type === 'transfer' ? 'From Account' : 'Account'}
            </label>

            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>

              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === 'transfer' && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  To Account
                </label>

                <Select
                  value={toAccountId}
                  onValueChange={(value) => {
                    setToAccountId(value);
                    setTransferPurpose(TRANSFER_PURPOSES.normal);
                    setCategoryId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>

                  <SelectContent>
                    {accounts
                      .filter((account) => account.id !== accountId)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Transfer Purpose
                </label>

                <Select
                  value={transferPurpose}
                  onValueChange={(value) => {
                    setTransferPurpose(value);
                    setCategoryId('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>

                  <SelectContent>
                    {transferPurposeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {
                    transferPurposeOptions.find(
                      (option) => option.value === transferPurpose
                    )?.description
                  }
                </p>
              </div>

              {requiresCategory && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {transferPurpose === TRANSFER_PURPOSES.savingsAllocation
                      ? 'Savings Category'
                      : 'Debt Category'}
                  </label>

                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          transferPurpose === TRANSFER_PURPOSES.savingsAllocation
                            ? 'Select savings category'
                            : 'Select debt category'
                        }
                      />
                    </SelectTrigger>

                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: category.color || '#0078D4' }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Date
            </label>

            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Note
            </label>

            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a note."
              className="h-20 resize-none"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={saving || deleting || !amount}
          className="mt-5 h-12 w-full text-sm font-semibold"
        >
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Transaction'}
        </Button>

        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeleteOpen(true)}
            disabled={saving || deleting || !existingTransaction}
            className="mt-3 h-12 w-full text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Transaction
          </Button>
        )}
      </main>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="overflow-hidden rounded-3xl border border-destructive/25 app-card-surface-strong p-0 shadow-[0_24px_80px_rgba(127,29,29,0.22)] backdrop-blur-2xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <DialogHeader className="border-b border-destructive/20 px-6 py-5">
            <DialogTitle className="flex items-center gap-3 text-lg font-bold text-destructive">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </span>
              Delete Transaction
            </DialogTitle>

            <DialogDescription className="pt-2 text-sm leading-6">
              This will permanently delete the transaction and reverse its account balance effects.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-6 py-5">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm leading-6 text-muted-foreground">
              Linked goal contribution effects will also be reversed when this transaction
              belongs to a savings goal.
            </div>
          </div>

          <DialogFooter className="border-t border-border/50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="rounded-2xl"
              onClick={handleDelete}
              disabled={deleting || !existingTransaction}
            >
              {deleting ? 'Deleting...' : 'Delete Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
