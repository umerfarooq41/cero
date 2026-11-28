import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import CategoryIcon, { iconNames } from '@/components/shared/CategoryIcon';
import AppTabs from '@/components/shared/AppTabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { calculateNextDueDate, formatRecurringDate, FREQUENCY_OPTIONS, getRecurringFrequencyLabel, todayIsoDate } from '@/lib/recurringTransactions';
import { cn } from '@/lib/utils';
import { COLORS, TYPE_LABELS, TYPE_TABS, emptyForm, normalizeCategoryType, normalizeRuleType, isCheckingAccount, isLiabilityAccount, getAccountLabel } from './recurringPanelHelpers';

export default function RecurringRuleModal({
  open,
  onClose,
  onSave,
  editingRule = null,
  initialType = 'expense',
  accounts = [],
  categories = [],
  allTransactions = [],
  formatCurrency,
  saving = false,
  saveError = '',
}) {
  const nameRef = useRef(null);
  const [form, setForm] = useState(() => emptyForm(initialType));
  const isEditing = !!editingRule;
  const isDebt = form.type === 'transfer';
  const isFixedDebtLocked = Boolean(
    isEditing &&
    normalizeRuleType(editingRule?.type) === 'transfer' &&
    (editingRule?.payment_mode || 'fixed') === 'fixed'
  );
  const postedDebtTransactions = useMemo(
    () => isEditing && normalizeRuleType(editingRule?.type) === 'transfer'
      ? allTransactions.filter((transaction) =>
          transaction.recurring_transaction_id === editingRule.id &&
          transaction.type === 'transfer'
        )
      : [],
    [allTransactions, editingRule, isEditing]
  );
  const postedInstallments = useMemo(
    () => new Set(
      postedDebtTransactions
        .map((transaction) => transaction.recurring_posted_for_date)
        .filter(Boolean)
    ).size,
    [postedDebtTransactions]
  );
  const paidDebtAmount = useMemo(
    () => postedDebtTransactions.reduce(
      (sum, transaction) => sum + Math.max(0, Number(transaction.amount || 0)),
      0
    ),
    [postedDebtTransactions]
  );
  const hasPostedDebtHistory = isDebt && isEditing && postedDebtTransactions.length > 0;
  const isCompletedDebt = isDebt && isEditing && Boolean(editingRule?.completed_at);
  const debtTotal = Math.max(0, Number(form.total_amount || 0));
  const debtInstallments = Math.max(0, Math.floor(Number(form.duration_count || 0)));
  const debtRemaining = Math.max(0, debtTotal - paidDebtAmount);
  const remainingDebtInstallments = hasPostedDebtHistory
    ? Math.max(0, debtInstallments - postedInstallments)
    : debtInstallments;
  const finalInstallmentDate = useMemo(() => {
    if (!isDebt || !form.next_due_date || remainingDebtInstallments <= 0) return null;
    let date = form.next_due_date;
    for (let index = 1; index < remainingDebtInstallments; index += 1) {
      date = calculateNextDueDate(date, form.frequency);
    }
    return date;
  }, [form.frequency, form.next_due_date, isDebt, remainingDebtInstallments]);

  useEffect(() => {
    if (!open) return;

    if (editingRule) {
      setForm({
        name: editingRule.name || '',
        amount: String(editingRule.amount ?? ''),
        total_amount: String(editingRule.total_amount ?? Math.max(0, Number(accounts.find((account) => account.id === editingRule.to_account_id)?.balance || 0))),
        duration_count: String(editingRule.duration_count ?? ''),
        payment_mode: editingRule.payment_mode || 'fixed',
        type: normalizeRuleType(editingRule.type),
        category_id: editingRule.category_id || 'none',
        account_id: editingRule.account_id || 'none',
        to_account_id: editingRule.to_account_id || 'none',
        frequency: editingRule.frequency || 'monthly',
        next_due_date:
          normalizeRuleType(editingRule.type) === 'transfer'
            ? (editingRule.next_due_date || editingRule.start_date || todayIsoDate())
            : (editingRule.next_due_date || todayIsoDate()),
        is_active: editingRule.is_active !== false,
        icon: editingRule.icon || 'receipt',
        color: editingRule.color || COLORS[0],
        note: editingRule.note || '',
      });
    } else {
      setForm(emptyForm(initialType));
    }

    setTimeout(() => nameRef.current?.focus(), 80);
  }, [editingRule, initialType, open]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const type = normalizeCategoryType(category.type);

      if (form.type === 'income') return type === 'income';
      if (form.type === 'expense') return type === 'expense';

      return type === 'debt' || type === 'savings';
    });
  }, [categories, form.type]);

  const checkingAccounts = useMemo(
    () => accounts.filter((account) => isCheckingAccount(account)),
    [accounts]
  );

  const liabilityAccounts = useMemo(
    () => accounts.filter((account) => isLiabilityAccount(account)),
    [accounts]
  );

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    const totalAmount = Number(form.total_amount || 0);
    const durationCount = Math.max(0, Math.floor(Number(form.duration_count || 0)));
    const amount = Number(form.amount || 0);

    if (!form.name.trim()) {
      toast.error('Enter a recurring rule name');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (form.account_id === 'none') {
      toast.error(
        form.type === 'transfer'
          ? 'Select a from account'
          : 'Select a checking account'
      );
      return;
    }

    if (form.type === 'transfer' && form.to_account_id === 'none') {
      toast.error('Select a liability account');
      return;
    }

    if (!form.next_due_date) {
      toast.error('Select the next due date');
      return;
    }

    if (form.type === 'transfer' && (!totalAmount || totalAmount <= 0)) {
      toast.error('Enter the total debt');
      return;
    }

    const lockedFixedDebt = isFixedDebtLocked ? editingRule : null;
    const savedFrequency = lockedFixedDebt?.frequency || form.frequency;
    const savedDurationCount = lockedFixedDebt
      ? lockedFixedDebt.duration_count
      : (form.type === 'transfer' && durationCount > 0 ? durationCount : null);

    await onSave({
      name: form.name.trim(),
      amount: lockedFixedDebt ? Number(lockedFixedDebt.amount) : amount,
      total_amount: lockedFixedDebt ? lockedFixedDebt.total_amount : (form.type === 'transfer' ? totalAmount : null),
      duration_count: savedDurationCount,
      duration_unit: lockedFixedDebt
        ? lockedFixedDebt.duration_unit
        : (form.type === 'transfer' && durationCount > 0 ? (form.frequency === 'weekly' ? 'weeks' : form.frequency === 'yearly' ? 'years' : 'months') : null),
      completed_at: editingRule?.completed_at || null,
      payment_mode: lockedFixedDebt ? 'fixed' : (form.type === 'transfer' ? form.payment_mode : null),
      type: lockedFixedDebt ? 'transfer' : form.type,
      category_id: form.category_id === 'none' ? null : form.category_id,
      account_id: form.account_id === 'none' ? null : form.account_id,
      to_account_id:
        form.type === 'transfer' ? form.to_account_id : null,
      frequency: savedFrequency,
      start_date: lockedFixedDebt
        ? lockedFixedDebt.start_date
        : (editingRule?.start_date || form.next_due_date),
      next_due_date: lockedFixedDebt
        ? lockedFixedDebt.next_due_date
        : form.next_due_date,
      schedule_anchor_day: lockedFixedDebt
        ? lockedFixedDebt.schedule_anchor_day
        : Number(form.next_due_date.slice(8, 10)),
      is_active: form.is_active,
      icon: form.icon,
      color: form.color,
      note: form.note.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-md app-desktop-editor">
        <DialogHeader>
          <DialogTitle>{isDebt ? (isEditing ? 'Edit Debt' : 'New Debt') : (isEditing ? 'Edit Recurring Rule' : 'New Recurring Rule')}</DialogTitle>
        </DialogHeader>

        <div className="app-dialog-scroll space-y-3">
        <div className="flex items-center gap-3 rounded-2xl app-card-surface-soft p-3">
          <CategoryIcon icon={form.icon} color={form.color} size="lg" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold lg:text-base">
              {form.name.trim() || 'Recurring Rule'}
            </div>
            <div className="text-xs text-muted-foreground">
              {isCompletedDebt ? (
                <>Completed · {formatCurrency ? formatCurrency(debtTotal) : debtTotal} paid in full</>
              ) : isDebt && hasPostedDebtHistory ? (
                <>
                  Fixed debt · {postedInstallments} of {debtInstallments || '—'} paid · {formatCurrency ? formatCurrency(debtRemaining) : debtRemaining} remaining
                </>
              ) : isDebt ? (
                <>{form.payment_mode === 'fixed' ? 'Fixed debt' : 'Flexible debt'} · {getRecurringFrequencyLabel(form.frequency)}</>
              ) : (
                <>{TYPE_LABELS[form.type] || 'Expense'} · {getRecurringFrequencyLabel(form.frequency)}</>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Name
            </label>
            <Input
              ref={nameRef}
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
              placeholder="e.g. Rent, Salary, Car Loan"
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSave();
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Type
            </label>
            <AppTabs
              tabs={TYPE_TABS}
              value={form.type}
              onChange={(value) => {
                if (hasPostedDebtHistory || isFixedDebtLocked) return;
                updateForm('type', value);
                updateForm('category_id', 'none');
                updateForm('account_id', 'none');
                updateForm('to_account_id', 'none');
              }}
              size="sm"
              layoutId="recurring-type-highlight"
              className={cn((hasPostedDebtHistory || isFixedDebtLocked) && 'pointer-events-none opacity-70')}
            />
          </div>

          {form.type === 'transfer' && !isCompletedDebt && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment mode</label>
              <Select value={form.payment_mode} disabled={hasPostedDebtHistory || isFixedDebtLocked} onValueChange={(value) => updateForm('payment_mode', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed installments</SelectItem>
                  <SelectItem value="flexible">Flexible payments</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{form.payment_mode === 'fixed' ? 'Each payment completes one installment. You can also pay the next installment early.' : 'Pay any amount, as many times as needed. Every payment reduces the remaining debt.'}</p>
            </div>
          )}

          {form.type === 'transfer' && !isCompletedDebt && (
            <div className="space-y-3 lg:space-y-5">
              <div>
                <p className="text-sm font-semibold">Payment plan</p>
                <p className="text-xs text-muted-foreground">
                  {isFixedDebtLocked
                    ? 'Fixed installment terms can’t be changed after creation.'
                    : hasPostedDebtHistory
                      ? 'Paid installments stay unchanged. You can adjust only the remaining flexible payment plan.'
                      : 'Set the original debt and installment schedule. The first installment is recorded on the selected start date.'}
                </p>
              </div>
              {hasPostedDebtHistory && (
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/35 px-3 py-2.5">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">First installment</p>
                    <p className="mt-1 text-sm font-medium">{formatRecurringDate(editingRule?.start_date || form.next_due_date)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Paid so far</p>
                    <p className="mt-1 text-sm font-medium">{formatCurrency ? formatCurrency(paidDebtAmount) : paidDebtAmount}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total debt</label>
                  <Input value={form.total_amount} onChange={(event) => {
                    const total = Number(event.target.value || 0);
                    setForm((current) => ({ ...current, total_amount: event.target.value, amount: Number(current.duration_count) > 0 && total > 0 ? (total / Number(current.duration_count)).toFixed(2) : current.amount }));
                  }} disabled={hasPostedDebtHistory || isFixedDebtLocked} type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{hasPostedDebtHistory ? 'Installments left' : 'Installments'}</label>
                  <Input
                    value={hasPostedDebtHistory ? Math.max(0, debtInstallments - postedInstallments) : form.duration_count}
                    onChange={(event) => {
                      const raw = event.target.value;
                      if (raw === '') {
                        setForm((current) => ({ ...current, duration_count: '' }));
                        return;
                      }
                      const count = Math.max(1, Math.floor(Number(raw)));
                      setForm((current) => ({
                        ...current,
                        duration_count: String(hasPostedDebtHistory ? postedInstallments + count : count),
                        amount: !hasPostedDebtHistory && Number(current.total_amount) > 0
                          ? (Number(current.total_amount) / count).toFixed(2)
                          : current.amount,
                      }));
                    }}
                    disabled={isFixedDebtLocked}
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    placeholder="Enter number"
                  />
                </div>
              </div>
            </div>
          )}

          {!isCompletedDebt && <div className="grid grid-cols-2 gap-3">
            {!(form.type === 'transfer' && form.payment_mode === 'fixed' && !hasPostedDebtHistory) && (
              <div className="space-y-1.5">
                <label className="whitespace-nowrap text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {form.type === 'transfer' ? 'Payment amount' : 'Amount'}
                </label>
                <Input
                  value={form.amount}
                  onChange={(event) => updateForm('amount', event.target.value)}
                  disabled={isFixedDebtLocked}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="whitespace-nowrap text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Frequency
              </label>
              <Select value={form.frequency} disabled={isFixedDebtLocked} onValueChange={(value) => updateForm('frequency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.type === 'transfer' && form.payment_mode === 'fixed' && !hasPostedDebtHistory && (
            <div className="space-y-1.5">
              <label className="whitespace-nowrap text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</label>
              <Select value={form.category_id} onValueChange={(value) => updateForm('category_id', value)}>
                <SelectTrigger><SelectValue placeholder="No category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}
          </div>}

          {!isCompletedDebt && !(form.type === 'transfer' && form.payment_mode === 'fixed' && !hasPostedDebtHistory) && (
          <div className={cn('grid gap-3', form.type === 'transfer' ? 'grid-cols-1' : 'grid-cols-2')}>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Category
              </label>
              <Select value={form.category_id} onValueChange={(value) => updateForm('category_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={cn('space-y-1.5', form.type === 'transfer' && 'hidden')}>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Account
              </label>
              <Select value={form.account_id} onValueChange={(value) => updateForm('account_id', value)}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      form.type === 'transfer'
                        ? 'Select from account'
                        : 'Select checking account'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {form.type === 'transfer'
                      ? 'Select from account'
                      : 'Select checking account'}
                  </SelectItem>
                  {checkingAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {getAccountLabel(account)}
                    </SelectItem>
                  ))}
                  {checkingAccounts.length === 0 && (
                    <SelectItem value="no-checking-accounts" disabled>
                      No checking accounts
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          )}

          {form.type === 'transfer' && !isCompletedDebt && (
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pay from</label>
                <Select value={form.account_id} onValueChange={(value) => updateForm('account_id', value)}>
                  <SelectTrigger className="min-w-0"><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select account</SelectItem>
                    {checkingAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>{getAccountLabel(account)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Debt account
                </label>
                <Select value={form.to_account_id} onValueChange={(value) => updateForm('to_account_id', value)}>
                  <SelectTrigger className="min-w-0">
                    <SelectValue placeholder="Select liability account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select liability account</SelectItem>
                    {liabilityAccounts
                      .filter((account) => account.id !== form.account_id)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {getAccountLabel(account)}
                        </SelectItem>
                      ))}
                    {liabilityAccounts.length === 0 && (
                      <SelectItem value="no-liability-accounts" disabled>
                        No liability accounts
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {!isCompletedDebt && <div className="min-w-0 space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {form.type === 'transfer' ? (hasPostedDebtHistory ? 'Next installment' : 'First installment') : 'Next due date'}
              </label>
              <Input
                value={form.next_due_date}
                onChange={(event) => updateForm('next_due_date', event.target.value)}
                type="date"
                disabled={isFixedDebtLocked}
                className="min-w-0"
              />
          </div>}

          {!isCompletedDebt && isDebt && form.payment_mode === 'fixed' && debtInstallments > 0 && Number(form.amount || 0) > 0 && (
            <div className="rounded-2xl app-card-surface-soft px-4 py-3">
              <p className="text-sm font-semibold">
                {remainingDebtInstallments} {getRecurringFrequencyLabel(form.frequency).toLowerCase()} payments of {formatCurrency ? formatCurrency(Number(form.amount || 0)) : Number(form.amount || 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatRecurringDate(form.next_due_date)}
                {finalInstallmentDate ? <> → {formatRecurringDate(finalInstallmentDate)}</> : null}
                {hasPostedDebtHistory ? <> · {formatCurrency ? formatCurrency(debtRemaining) : debtRemaining} remaining</> : null}
              </p>
            </div>
          )}

          {!isCompletedDebt && <label className="flex items-center justify-between border-t border-border/50 px-1 py-3 text-sm">
            <span>
              <span className="font-medium">{isDebt ? 'Payment schedule active' : 'Active rule'}</span>
              <span className="block text-xs text-muted-foreground">
                {isDebt
                  ? 'Pause future scheduled installments without changing existing payment history.'
                  : 'Paused rules stay saved but are not treated as active scheduled items.'}
              </span>
            </span>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => updateForm('is_active', event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
          </label>}

          <section className="border-t border-border/50">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <CategoryIcon icon={form.icon} color={form.color} size="sm" />
                <div>
                  <p className="text-sm font-medium">Appearance</p>
                  <p className="text-xs text-muted-foreground">Color and icon</p>
                </div>
              </div>
              
            </div>

            <div className="space-y-4 pb-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Color</label>
                <div className="app-appearance-colors">
                  {COLORS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => updateForm('color', item)}
                      className={cn(
                        'app-color-swatch',
                        form.color === item ? 'is-selected' : ''
                      )}
                      style={{ backgroundColor: item }}
                      aria-pressed={form.color === item}
                      aria-label={`Use color ${item}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Icon</label>
                <div className="app-appearance-icons">
                  {iconNames.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => updateForm('icon', item)}
                      className={cn('app-icon-choice', form.icon === item && 'is-selected')}
                      title={item}
                      aria-label={`Use icon ${item}`}
                      aria-pressed={form.icon === item}
                    >
                      <CategoryIcon icon={item} color={form.icon === item ? form.color : '#888'} size="sm" bare />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Note
            </label>
            <Textarea
              value={form.note}
              onChange={(event) => updateForm('note', event.target.value)}
              placeholder="Optional note"
              rows={3}
            />
          </div>
        </div>

        </div>
        {saveError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive break-words">{saveError}</p>}
        <DialogFooter className="app-dialog-actions">
          <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving...' : isEditing ? (isDebt ? 'Update Debt' : 'Update Rule') : (isDebt ? 'Create debt' : 'Create rule')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

