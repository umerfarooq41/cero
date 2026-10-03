import { Clock3 } from "lucide-react";

import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  formatRecurringDate,
  getRecurringFrequencyLabel,
  getRecurringStatus,
} from "@/lib/recurringTransactions";
import {
  isDueNow,
  normalizeRuleType,
  RECURRING_SECTIONS,
} from "./scheduledUtils";
import ScheduledItemCard, {
  ScheduledSectionCard,
  ScheduledStatusBadge,
} from "./ScheduledItemCard";

function RecurringPaymentDialog({
  dialog,
  accounts,
  saving,
}) {
  const rule = dialog.rule;
  const plannedAmount = Number(rule?.month_planned_amount || rule?.amount || 0);
  const paidThisMonth = Number(rule?.month_paid_amount || 0);
  const remainingAmount = Math.max(0, plannedAmount - paidThisMonth);

  const fromAccount = accounts.find(
    (account) => account.id === rule?.account_id,
  );
  const toAccount = accounts.find(
    (account) => account.id === rule?.to_account_id,
  );

  if (!rule) return null;

  return (
    <Dialog open={dialog.open} onOpenChange={(open) => !open && dialog.closeDialog()}>
      <DialogContent className="max-w-lg rounded-3xl app-card-surface-strong backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>
            {remainingAmount > 0
              ? `Pay ${rule.name}`
              : `Add extra to ${rule.name}`}
          </DialogTitle>
          <DialogDescription>
            This posts a credit card payment transfer using the saved recurring
            accounts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-2xl app-card-surface-soft p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Payment path
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {fromAccount?.name || "Missing from account"} →{" "}
              {toAccount?.name || "Missing credit card"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Checking decreases and the credit card liability decreases.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Amount
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={dialog.amount}
              onChange={(event) => dialog.setAmount(event.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Date
            </label>
            <Input
              type="date"
              value={dialog.date}
              onChange={(event) => dialog.setDate(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Note
            </label>
            <Textarea
              value={dialog.note}
              onChange={(event) => dialog.setNote(event.target.value)}
              className="h-20 resize-none"
              placeholder="Optional note"
            />
          </div>
        </div>

        <DialogFooter className="mt-4 border-t border-border/50 pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Button
            variant="outline"
            onClick={dialog.closeDialog}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={dialog.submit}
            disabled={saving || !fromAccount || !toAccount}
          >
            {saving ? "Saving..." : remainingAmount > 0 ? "Pay" : "Add extra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduledRecurringRow({
  rule,
  account,
  toAccount,
  category,
  currency,
  posting,
  onPost,
  paymentDialog,
  formatCurrencyElement,
}) {
  const status = getRecurringStatus(rule);
  const dueNow = isDueNow(status);
  const baseAmount = Math.abs(Number(rule.amount || 0));
  const type = normalizeRuleType(rule.type);
  const isDebt = type === "transfer";
  const flexibleCreditCard = isDebt && (rule.payment_mode || "fixed") === "flexible";
  const fixedDebt = isDebt && !flexibleCreditCard;
  const plannedThisMonth = Number(rule.month_planned_amount ?? baseAmount);
  const paidThisMonth = Number(rule.month_paid_amount || 0);
  const monthRemaining = Math.max(0, plannedThisMonth - paidThisMonth);
  const isMonthCovered =
    flexibleCreditCard && plannedThisMonth > 0 && monthRemaining <= 0;
  const displayAmount = flexibleCreditCard
    ? isMonthCovered
      ? plannedThisMonth
      : monthRemaining
    : baseAmount;
  const fallbackIcon =
    type === "income" ? "income" : type === "transfer" ? "loan" : "receipt";
  const buttonLabel = flexibleCreditCard
    ? posting ? "Saving…" : isMonthCovered ? "Add extra" : "Pay"
    : fixedDebt
      ? posting ? "Posting…" : dueNow ? "Pay installment" : "Pay next early"
      : posting ? "Posting…" : dueNow ? "Post" : "Future";
  const canUseAction = flexibleCreditCard
    ? rule.is_active && !posting && Boolean(rule.account_id && rule.to_account_id)
    : fixedDebt
      ? rule.is_active && !posting && Boolean(rule.account_id && rule.to_account_id)
      : dueNow && !posting && rule.is_active;

  const handleAction = () => {
    if (flexibleCreditCard) {
      paymentDialog.openDialog(rule);
      return;
    }

    onPost(rule);
  };

  return (
    <ScheduledItemCard
      icon={rule.icon || category?.icon || fallbackIcon}
      color={
        rule.color ||
        category?.color ||
        (type === "income"
          ? "#22c55e"
          : type === "transfer"
            ? "#0ea5e9"
            : "#ef4444")
      }
      title={rule.name}
      subtitle={
        <div className="flex min-w-0 items-center gap-1.5 truncate">
          <span className="truncate">
            {getRecurringFrequencyLabel(rule.frequency)} · {status.label}
          </span>
          {!rule.is_active && (
            <ScheduledStatusBadge className="border-border bg-secondary text-muted-foreground">
              Paused
            </ScheduledStatusBadge>
          )}
        </div>
      }
      meta={
        <>
          {fixedDebt && rule.duration_count ? `Payment ${Math.min(Number(rule.duration_count), Number(rule.posted_occurrence_count || 0) + 1)} of ${rule.duration_count} · ` : ""}Next {formatRecurringDate(rule.next_due_date)}
          {type === "transfer"
            ? ` · ${toAccount?.name || "Debt account"}`
            : account
              ? ` · ${account.name}`
              : ""}
        </>
      }
      amount={formatCurrencyElement(displayAmount, currency)}
      actions={
        <Button
          size="sm"
          variant={dueNow || flexibleCreditCard ? "default" : "secondary"}
          onClick={handleAction}
          disabled={!canUseAction}
          className="h-7 rounded-xl px-3 text-xs"
        >
          {buttonLabel}
        </Button>
      }
    />
  );
}

export default function ScheduledRecurringList({
  activeRecurring,
  recurringByType,
  categories,
  accounts,
  currency,
  postingId,
  paymentDialog,
  onPost,
  formatCurrencyElement,
}) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <h2 className="text-base font-semibold">Recurring Bills & Income</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Same layout as Manage Plan, with posting actions only for due items.
        </p>
      </div>

      {activeRecurring.length === 0 ? (
        <div className="rounded-2xl app-card-surface p-4">
          <EmptyState
            icon={Clock3}
            title="No recurring rules"
            description="Create recurring income, bills, and debt rules from Manage Plan first."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {RECURRING_SECTIONS.map((section) => {
            const rules = recurringByType[section.type] || [];

            return (
              <ScheduledSectionCard
                key={section.type}
                type={section.type}
                label={section.label}
                count={rules.length}
                defaultExpanded={section.type === "expense" || rules.length > 0}
                emptyText={`No scheduled ${section.label.toLowerCase()} right now.`}
              >
                {rules.map((rule) => {
                  const category = categories.find(
                    (item) => item.id === rule.category_id,
                  );
                  const account = accounts.find(
                    (item) => item.id === rule.account_id,
                  );
                  const toAccount = accounts.find(
                    (item) => item.id === rule.to_account_id,
                  );

                  return (
                    <ScheduledRecurringRow
                      key={rule.id}
                      rule={rule}
                      account={account}
                      toAccount={toAccount}
                      category={category}
                      currency={currency}
                      posting={postingId === rule.id}
                      onPost={onPost}
                      paymentDialog={paymentDialog}
                      formatCurrencyElement={formatCurrencyElement}
                    />
                  );
                })}
              </ScheduledSectionCard>
            );
          })}
        </div>
      )}

      <RecurringPaymentDialog
        dialog={paymentDialog}
        accounts={accounts}
        saving={Boolean(postingId)}
      />
    </section>
  );
}
