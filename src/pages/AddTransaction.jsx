import { useAppSheetKeyboard } from '@/hooks/useAppSheetKeyboard';
import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowDownLeft,
  X,
  ArrowLeftRight,
  ArrowUpRight,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
} from '@/hooks/useBudgetData';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/lib/supabase';
import { invalidateScheduledQueries } from '@/lib/queryInvalidation';
import { getCurrencyCode, getCurrencySymbol } from '@/lib/currencies';

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
  const currencyCode = getCurrencyCode(currency);
  const symbol = getCurrencySymbol(currencyCode);

  if (currencyCode === 'SAR') {
    return (
      <span
        aria-label="SAR"
        className="inline-block h-[1em] w-[1em] shrink-0 bg-current opacity-90 align-[-0.08em]"
        style={{
          WebkitMask: 'url(/sar.svg) center / contain no-repeat',
          mask: 'url(/sar.svg) center / contain no-repeat',
        }}
      />
    );
  }

  return (
    <span className="text-[1em] font-bold leading-none text-current">
      {symbol}
    </span>
  );
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
  useAppSheetKeyboard();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const queryClient = useQueryClient();

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: allTransactions = [] } = useAllTransactions();

  const existingTransaction = allTransactions.find((transaction) => transaction.id === id);
  const currency = useCurrency();
  const isRecurringDateCorrection = isEditing && (Boolean(existingTransaction?.recurring_transaction_id) || Boolean(existingTransaction?.savings_goal_id));
  const [occurrenceDate, setOccurrenceDate] = useState('');
  const [linkedFixed, setLinkedFixed] = useState(true);

  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferPurpose, setTransferPurpose] = useState(TRANSFER_PURPOSES.normal);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [linkedSaveError, setLinkedSaveError] = useState('');
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
    setOccurrenceDate(existingTransaction.recurring_posted_for_date || existingTransaction.date || format(new Date(), 'yyyy-MM-dd'));
    setNote(existingTransaction.note || '');
  }, [categories, existingTransaction]);

  useEffect(() => {
    if (!isRecurringDateCorrection || !existingTransaction) return;
    let active = true;
    const load = async () => {
      if (existingTransaction.recurring_transaction_id) {
        const { data } = await supabase.from('recurring_transactions')
          .select('payment_mode,type').eq('id', existingTransaction.recurring_transaction_id).maybeSingle();
        if (active) setLinkedFixed(data?.type === 'transfer' && (data?.payment_mode || 'fixed') === 'fixed');
      } else if (existingTransaction.savings_goal_id) {
        const { data } = await supabase.from('savings_goals')
          .select('contribution_mode').eq('id', existingTransaction.savings_goal_id).maybeSingle();
        if (active) setLinkedFixed((data?.contribution_mode || 'flexible') === 'fixed');
      }
    };
    load();
    return () => { active = false; };
  }, [isRecurringDateCorrection, existingTransaction?.recurring_transaction_id, existingTransaction?.savings_goal_id]);

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
    if (isRecurringDateCorrection) {
      if (!date || !occurrenceDate || !(Number(amount) > 0)) { toast.error('Enter a valid amount and both dates'); return; }
      setLinkedSaveError('');
      setSaving(true);
      try {
        const { error } = await supabase.rpc('cero_edit_linked_payment', {
          p_transaction_id: id,
          p_actual_date: date,
          p_occurrence_date: occurrenceDate,
          p_amount: Number(amount),
          p_note: note || null,
        });
        if (error) throw error;
        invalidateScheduledQueries(queryClient);
        toast.success('Payment schedule corrected');
        navigate('/transactions');
      } catch (error) {
        console.error('Linked payment save failed:', error);
        const message = error?.message || 'Could not save the payment';
        setLinkedSaveError(message);
        toast.error(message);
      } finally {
        setSaving(false);
      }
      return;
    }
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

      const rpcName = isEditing
        ? 'cero_update_transaction'
        : 'cero_create_transaction';

      const rpcPayload = {
        p_amount: data.amount,
        p_type: data.type,
        p_date: data.date,
        p_account_id: data.account_id,
        p_to_account_id: data.to_account_id,
        p_category_id: data.category_id,
        p_note: data.note,
      };

      if (isEditing) {
        rpcPayload.p_transaction_id = id;
      }

      const { error } = await supabase.rpc(rpcName, rpcPayload);
      if (error) throw error;

      invalidateScheduledQueries(queryClient);

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
      const { error } = await supabase.rpc('cero_delete_transaction', {
        p_transaction_id: existingTransaction.id,
      });

      if (error) throw error;

      invalidateScheduledQueries(queryClient);

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

  return createPortal(
    <>
      <div className="app-route-sheet-backdrop" aria-hidden="true" />
    <div className="app-route-sheet app-sheet-surface">
      <header className="app-sheet-header shrink-0 px-5 pb-2 pt-2">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-muted-foreground/35" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold">{isEditing ? 'Edit transaction' : 'Add transaction'}</h1>
          <button type="button" onClick={() => navigate('/transactions')} aria-label="Close" className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted/60"><X className="size-5" /></button>
        </div>
      </header>

      {isRecurringDateCorrection ? (
        <>
        <main className="app-route-sheet-body mx-auto w-full max-w-3xl px-4 py-4">
          <div className="space-y-4 rounded-2xl app-card-surface p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Correct the payment amount, actual date, and scheduled installment. Changes to amounts automatically adjust balances.</p>
            <div className="space-y-1.5">
              <label htmlFor="linked-payment-amount" className="text-sm font-medium">Payment amount</label>
              <Input id="linked-payment-amount" type="number" min="0.01" step="0.01" value={amount} disabled={linkedFixed} onChange={(event) => setAmount(event.target.value)} />
              {linkedFixed && <p className="text-xs text-muted-foreground">Fixed installment amount cannot be changed.</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="recurring-payment-date" className="text-sm font-medium">Actual payment date</label>
              <Input id="recurring-payment-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="scheduled-occurrence-date" className="text-sm font-medium">Scheduled installment date</label>
              <Input id="scheduled-occurrence-date" type="date" value={occurrenceDate} onChange={(event) => setOccurrenceDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="linked-payment-note" className="text-sm font-medium">Note</label>
              <Textarea id="linked-payment-note" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
            {linkedSaveError && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{linkedSaveError}</div>}
          </div>
        </main>
        <div className="app-route-sheet-footer">
            <Button type="button" className="w-full" disabled={saving || deleting || !date || !occurrenceDate || !(Number(amount) > 0)} onClick={handleSubmit}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteOpen(true)}
              disabled={saving || deleting || !existingTransaction}
              className="h-12 w-full text-sm font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Transaction
            </Button>
        </div>
        </>
      ) : (
      <>
      <main className="app-route-sheet-body mx-auto w-full max-w-3xl px-4 py-3">
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
              <span className="mr-3 flex shrink-0 items-center text-2xl font-bold leading-none text-foreground sm:text-3xl">
                <CurrencyPrefix currency={currency} />
              </span>

              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className="app-amount-input h-full min-w-0 flex-1 appearance-none border-0 bg-transparent px-0 text-left text-2xl font-bold tabular-nums tracking-tight text-foreground outline-none ring-0 placeholder:text-muted-foreground/45 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 sm:text-3xl [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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

      </main>
        <div className="app-route-sheet-footer">
        <Button
          onClick={handleSubmit}
          disabled={saving || deleting || !amount}
          className="h-11 w-full text-sm font-semibold"
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
        </div>
      </>
      )}

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
              {isRecurringDateCorrection
                ? 'This also removes the linked recurring payment or goal contribution and updates its schedule or progress. Account balance effects will be reversed.'
                : 'The account balance effects of this transaction will be reversed.'}
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
    </>
  , document.body);
}
