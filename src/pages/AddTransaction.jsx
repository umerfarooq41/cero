import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
import { useAccounts, useAllTransactions, useCategories } from '@/hooks/useBudgetData';
import { useCurrency } from '@/hooks/useCurrency';
import { accountsApi, transactionsApi } from '@/lib/budgetData';
import { cn } from '@/lib/utils';

const typeOptions = [
  {
    value: 'expense',
    label: 'Expense',
    icon: ArrowUpRight,
    color: 'border-destructive bg-destructive/10 text-destructive',
  },
  {
    value: 'income',
    label: 'Income',
    icon: ArrowDownLeft,
    color:
      'border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
  },
  {
    value: 'transfer',
    label: 'Transfer',
    icon: ArrowLeftRight,
    color: 'border-primary bg-primary/10 text-primary',
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
    return <img src="/sar.svg" alt="SAR" className="h-8 w-8 opacity-70" />;
  }

  return <span>{currencyCode}</span>;
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

  const destinationAccount = useMemo(
    () => accounts.find((account) => account.id === toAccountId),
    [accounts, toAccountId]
  );

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId]
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

  return (
    <div className="mx-auto max-w-lg px-4 py-6 lg:py-10">
      <div className="mb-8 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <h1 className="text-xl font-bold tracking-tight">
          {isEditing ? 'Edit Transaction' : 'Add Transaction'}
        </h1>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
          Amount
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center text-3xl font-light text-muted-foreground">
            <CurrencyPrefix currency={currency} />
          </div>

          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            className="w-48 border-none bg-transparent text-center text-5xl font-bold tabular-nums outline-none"
            step="0.01"
            min="0"
            autoFocus
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2">
        {typeOptions.map((option) => {
          const isActive = type === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setType(option.value);
                setCategoryId('');
                setToAccountId('');
                setTransferPurpose(TRANSFER_PURPOSES.normal);
              }}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 text-sm font-medium transition-all',
                isActive
                  ? option.color
                  : 'border-border text-muted-foreground hover:border-muted-foreground/30'
              )}
            >
              <Icon className="h-5 w-5" />
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
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
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
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
        disabled={saving || !amount}
        className="mt-6 h-12 w-full text-sm font-semibold"
      >
        {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Transaction'}
      </Button>
    </div>
  );
}
