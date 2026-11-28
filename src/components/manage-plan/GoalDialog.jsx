import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import CategoryIcon, { iconNames } from '@/components/shared/CategoryIcon';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatGoalDate, getFixedGoalTargetDate, todayIsoDate } from '@/lib/goals';
import { cn } from '@/lib/utils';
import { COLORS, emptyGoalForm, isCheckingAccount, isSavingsAccount, getAccountLabel } from './goalPanelHelpers';

export default function GoalDialog({ open, onOpenChange, editingGoal, onSave, saveError, saving, accounts = [] }) {
  const nameRef = useRef(null);
  const [form, setForm] = useState(emptyGoalForm);

  useEffect(() => {
    if (!open) return;

    if (editingGoal) {
      setForm({
        name: editingGoal.name || '',
        target_amount: String(editingGoal.target_amount ?? ''),
        current_amount: String(editingGoal.starting_amount ?? editingGoal.current_amount ?? ''),
        target_date: editingGoal.target_date || '',
        duration_count: String(editingGoal.duration_count ?? ''),
        frequency: editingGoal.frequency || (editingGoal.duration_unit === 'weeks' ? 'weekly' : editingGoal.duration_unit === 'years' ? 'yearly' : 'monthly'),
        start_date: editingGoal.start_date || editingGoal.next_due_date || todayIsoDate(),
        contribution_mode: editingGoal.contribution_mode || 'flexible',
        from_account_id: editingGoal.from_account_id || 'none',
        to_account_id: editingGoal.to_account_id || 'none',
        icon_key: editingGoal.icon_key || 'target',
        color_key: editingGoal.color_key || '#276FE4',
        note: editingGoal.note || '',
      });
    } else {
      setForm(emptyGoalForm());
    }

  }, [editingGoal, open]);

  const checkingAccounts = useMemo(
    () => accounts.filter((account) => isCheckingAccount(account)),
    [accounts]
  );

  const savingsAccounts = useMemo(
    () => accounts.filter((account) => isSavingsAccount(account)),
    [accounts]
  );

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    const targetAmount = Number(form.target_amount || 0);
    const currentAmount = Number(form.current_amount || 0);

    if (!form.name.trim()) {
      toast.error('Enter a goal name');
      return;
    }

    if (!targetAmount || targetAmount <= 0) {
      toast.error('Enter a valid target amount');
      return;
    }

    if (currentAmount < 0) {
      toast.error('Starting amount cannot be negative');
      return;
    }

    if (currentAmount > targetAmount) {
      toast.error('Starting amount cannot be higher than the target');
      return;
    }

    if (form.from_account_id === 'none') {
      toast.error('Select a from account');
      return;
    }

    if (form.to_account_id === 'none') {
      toast.error('Select a savings account');
      return;
    }

    if (form.from_account_id === form.to_account_id) {
      toast.error('From and to accounts must be different');
      return;
    }

    const preserveFixedSchedule = Boolean(editingGoal?.id) && (editingGoal?.contribution_mode || 'flexible') === 'fixed';

    onSave({
      name: form.name.trim(),
      target_amount: preserveFixedSchedule ? Number(editingGoal.target_amount || 0) : targetAmount,
      starting_amount: preserveFixedSchedule ? Number(editingGoal.starting_amount ?? editingGoal.current_amount ?? 0) : currentAmount,
      current_amount: preserveFixedSchedule ? Number(editingGoal.current_amount || 0) : currentAmount,
      target_date: preserveFixedSchedule
        ? editingGoal.target_date
        : form.contribution_mode === 'fixed'
          ? getFixedGoalTargetDate(form.start_date, form.duration_count, form.frequency)
          : (form.target_date || null),
      duration_count: preserveFixedSchedule ? editingGoal.duration_count : (Number(form.duration_count) > 0 ? Math.floor(Number(form.duration_count)) : null),
      duration_unit: preserveFixedSchedule ? editingGoal.duration_unit : (Number(form.duration_count) > 0 ? (form.frequency === 'weekly' ? 'weeks' : form.frequency === 'yearly' ? 'years' : 'months') : null),
      frequency: preserveFixedSchedule ? editingGoal.frequency : (form.contribution_mode === 'fixed' ? form.frequency : null),
      // savings_goals.start_date is NOT NULL in Supabase. Flexible goals do
      // not use it as a due-date schedule, but still need a valid lifecycle
      // start date for persistence and reporting.
      start_date: preserveFixedSchedule
        ? editingGoal.start_date
        : (form.contribution_mode === 'fixed' ? form.start_date : (editingGoal?.start_date || todayIsoDate())),
      next_due_date: preserveFixedSchedule ? editingGoal.next_due_date : (form.contribution_mode === 'fixed' ? form.start_date : null),
      completed_at: editingGoal?.completed_at || null,
      contribution_mode: preserveFixedSchedule ? 'fixed' : form.contribution_mode,
      from_account_id: form.from_account_id === 'none' ? null : form.from_account_id,
      to_account_id: form.to_account_id === 'none' ? null : form.to_account_id,
      icon_key: form.icon_key || 'target',
      color_key: form.color_key || '#276FE4',
      note: form.note.trim() || null,
    });
  };

  const isEditing = Boolean(editingGoal?.id);
  const fixedScheduleLocked = isEditing && (editingGoal?.contribution_mode || 'flexible') === 'fixed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl app-desktop-editor app-desktop-wide-editor">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Goal' : 'New Goal'}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-2xl app-card-surface-soft p-3">
          <CategoryIcon icon={form.icon_key || 'target'} color={form.color_key || '#276FE4'} size="lg" />

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold lg:text-base">{form.name.trim() || 'Goal Name'}</div>
            <div className="text-xs text-muted-foreground">
              Target {form.target_amount ? Number(form.target_amount).toLocaleString() : '0'}
              {form.target_date ? ` · ${formatGoalDate(form.target_date)}` : ''}
            </div>
          </div>
        </div>

        <div className="app-dialog-scroll space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</label>
            <Input
              ref={nameRef}
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
              placeholder="e.g. Emergency fund"
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSubmit();
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Target amount</label>
              <Input
                disabled={fixedScheduleLocked}
                value={form.target_amount}
                onChange={(event) => updateForm('target_amount', event.target.value)}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="10000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Starting amount</label>
              <Input
                disabled={fixedScheduleLocked}
                value={form.current_amount}
                onChange={(event) => updateForm('current_amount', event.target.value)}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0"
              />
            </div>

            {form.contribution_mode !== 'fixed' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Target date</label>
                <Input
                  value={form.target_date}
                  onChange={(event) => updateForm('target_date', event.target.value)}
                  type="date"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contribution mode</label>
            <Select disabled={fixedScheduleLocked} value={form.contribution_mode} onValueChange={(value) => updateForm('contribution_mode', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed contributions</SelectItem>
                <SelectItem value="flexible">Flexible contributions</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{form.contribution_mode === 'fixed' ? 'Each planned contribution completes one scheduled occurrence.' : 'Contribute any amount, multiple times whenever you want.'}</p>
          </div>

          {form.contribution_mode === 'fixed' && (
            <div className="rounded-2xl app-card-surface-soft p-3 space-y-3">
              <div>
                <p className="text-sm font-semibold">Contribution schedule</p>
                <p className="text-xs text-muted-foreground">{fixedScheduleLocked ? 'Fixed contribution terms can’t be changed after creation.' : 'Set the number of contributions, their frequency, and the first contribution due date.'}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contributions</label>
                  <Input disabled={fixedScheduleLocked} value={form.duration_count} onChange={(event) => updateForm('duration_count', event.target.value)} type="number" min="1" step="1" inputMode="numeric" placeholder="12" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contribution frequency</label>
                  <Select disabled={fixedScheduleLocked} value={form.frequency} onValueChange={(value) => updateForm('frequency', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Biweekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">First contribution due</label>
                  <Input disabled={fixedScheduleLocked} value={form.start_date} onChange={(event) => updateForm('start_date', event.target.value)} type="date" />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">From account</label>
              <Select value={form.from_account_id} onValueChange={(value) => updateForm('from_account_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select checking account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select checking account</SelectItem>
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">To account</label>
              <Select value={form.to_account_id} onValueChange={(value) => updateForm('to_account_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select savings account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select savings account</SelectItem>
                  {savingsAccounts
                    .filter((account) => account.id !== form.from_account_id)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {getAccountLabel(account)}
                      </SelectItem>
                    ))}
                  {savingsAccounts.length === 0 && (
                    <SelectItem value="no-savings-accounts" disabled>
                      No savings accounts
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <section className="border-t border-border/50">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <CategoryIcon icon={form.icon_key || 'target'} color={form.color_key || '#276FE4'} size="sm" />
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
                  onClick={() => updateForm('color_key', item)}
                  className={cn(
                    'app-color-swatch',
                    form.color_key === item ? 'is-selected' : ''
                  )}
                  style={{ backgroundColor: item }}
                  aria-label={`Use color ${item}`}
                  aria-pressed={form.color_key === item}
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
                  onClick={() => updateForm('icon_key', item)}
                  className={cn(
                    'app-icon-choice', form.icon_key === item && 'is-selected'
                  )}
                  title={item}
                  aria-label={`Use icon ${item}`}
                  aria-pressed={form.icon_key === item}
                >
                  <CategoryIcon icon={item} color={form.icon_key === item ? form.color_key : '#888'} size="sm" bare />
                </button>
              ))}
            </div>
          </div>

            </div>
          </section>

          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Note</label>
            <Textarea
              value={form.note}
              onChange={(event) => updateForm('note', event.target.value)}
              placeholder="Why this goal matters"
              rows={3}
            />
          </div>
        </div>

        {saveError && (
          <p role="alert" className="shrink-0 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive break-words">
            {saveError}
          </p>
        )}
        <DialogFooter className="app-dialog-actions shrink-0 border-t border-border/40 bg-background/95 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

