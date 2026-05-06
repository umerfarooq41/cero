import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
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
import { useQueryClient } from '@tanstack/react-query';
import { accountsApi, transactionsApi } from '@/lib/budgetData';
import { toast } from 'sonner';
import { useCategories, useAccounts, useAllTransactions } from '@/hooks/useBudgetData';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';

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

function CurrencyPrefix({ currency }) {
  const currencyCode =
    typeof currency === 'string'
      ? currency
      : currency?.code || currency?.currency || 'SAR';

  if (currencyCode === 'SAR') {
    return <img src="/sar.svg" alt="SAR" className="w-8 h-8 opacity-70" />;
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
      destination.category === 'liability'
        ? -amount
        : amount;

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
      isDebtAccount(selectedFromAccount) ||
      isDebtAccount(selectedToAccount);

    if (involvesDebt) return 'debt';

    const involvesSavings =
      isSavingsAccount(selectedFromAccount) ||
      isSavingsAccount(selectedToAccount);

    if (involvesSavings) return 'savings';

    return null;
  };

  const transferCategoryType = getTransferCategoryType();

  const filteredCategories = categories.filter((c) => {
    if (type === 'expense') {
      return c.type === 'expense';
    }

    if (type === 'income') {
      return c.type === 'income';
    }

    if (type === 'transfer') {
      if (!transferCategoryType) return false;
      return c.type === transferCategoryType;
    }

    return false;
  });

  const shouldShowCategory =
    type !== 'transfer' || Boolean(transferCategoryType);

  const categoryPlaceholder =
    type === 'transfer' && !transferCategoryType
      ? 'No category needed'
      : 'Select category';

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (!accountId) {
      toast.error(
        type === 'transfer'
          ? 'Select a source account'
          : 'Select an account'
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
        to_account_id:
          type === 'transfer'
            ? toAccountId || null
            : null,
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

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

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
    <div className="max-w-lg mx-auto px-4 py-6 lg:py-10">
      <div className="flex items-center gap-3 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <h1 className="text-xl font-bold tracking-tight">
          {isEditing ? 'Edit Transaction' : 'Add Transaction'}
        </h1>
      </div>

      <div className="bg-card rounded-2xl border border-border p-8 mb-6 text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
          Amount
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="text-3xl font-light text-muted-foreground flex items-center">
            <CurrencyPrefix currency={currency} />
          </div>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="text-5xl font-bold bg-transparent border-none outline-none text-center w-48 tabular-nums"
            step="0.01"
            min="0"
            autoFocus
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {typeOptions.map((opt) => {
          const isActive = type === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setType(opt.value);
                setCategoryId('');
                setToAccountId('');
              }}
              className={cn(
                'flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-sm font-medium',
                isActive
                  ? opt.color
                  : 'border-border text-muted-foreground hover:border-muted-foreground/30'
              )}
            >
              <opt.icon className="w-5 h-5" />
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4 bg-card rounded-xl border border-border p-5">
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
                        className="w-2 h-2 rounded-full"
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
                <p className="text-[11px] text-muted-foreground">
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
        className="w-full h-12 mt-6 text-sm font-semibold"
      >
        {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Transaction'}
      </Button>
    </div>
  );
}