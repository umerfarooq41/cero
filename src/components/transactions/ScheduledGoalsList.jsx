import { PiggyBank } from "lucide-react";

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
  getGoalProgress,
  getGoalRemaining,
  getGoalStatus,
} from "@/lib/goals";
import ScheduledItemCard, { ScheduledSectionCard } from "./ScheduledItemCard";

function GoalContributionDialog({
  dialog,
  accounts,
  currency,
  saving,
  formatCurrencyElement,
}) {
  const goal = dialog.goal;
  const fromAccount = accounts.find(
    (account) => account.id === goal?.from_account_id,
  );
  const toAccount = accounts.find(
    (account) => account.id === goal?.to_account_id,
  );

  if (!goal) return null;

  return (
    <Dialog open={dialog.open} onOpenChange={(open) => !open && dialog.closeDialog()}>
      <DialogContent className="max-w-lg rounded-3xl app-card-surface-strong backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Contribute to {goal.name}</DialogTitle>
          <DialogDescription>
            This creates a transfer from the saved checking account to the saved
            savings account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-2xl app-card-surface-soft p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Transfer path
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {fromAccount?.name || "Missing from account"} →{" "}
              {toAccount?.name || "Missing savings account"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Goal progress is updated, but net worth stays neutral.
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
            {dialog.suggestedAmount && (
              <p className="text-xs text-muted-foreground">
                Suggested monthly amount:{" "}
                {formatCurrencyElement(Number(dialog.suggestedAmount), currency)}
              </p>
            )}
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
            {saving ? "Contributing..." : "Contribute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduledGoalRow({
  goal,
  fromAccount,
  toAccount,
  currency,
  saving,
  onContribute,
  formatCurrencyElement,
}) {
  const progress = getGoalProgress(goal);
  const target = Number(goal.target_amount || 0);
  const remaining = getGoalRemaining(goal);
  const status = getGoalStatus(goal);
  const color = goal.color_key || "#276FE4";
  const isCompleted = remaining <= 0 || progress >= 100;
  const statusLabel = status.key === "due" ? "Target passed" : status.label;
  const missingAccounts = !fromAccount || !toAccount;
  const plannedAmountRaw = goal.month_planned_amount;
  const plannedThisMonth = Number(plannedAmountRaw || 0);
  const hasMonthlyPlan = plannedAmountRaw !== null && plannedThisMonth > 0;
  const contributedThisMonth = Number(goal.month_contributed_amount || 0);
  const monthRemaining = hasMonthlyPlan
    ? Math.max(0, plannedThisMonth - contributedThisMonth)
    : null;
  const isMonthDone = !isCompleted && hasMonthlyPlan && monthRemaining <= 0;
  const isFixed = (goal.contribution_mode || "flexible") === "fixed";
  const displayAmount = isFixed
    ? Math.min(Number(goal.fixed_contribution_amount || 0), remaining)
    : remaining;
  const totalContributions = Math.max(1, Number(goal.duration_count || 0));
  const completedContributions = Math.min(
    totalContributions,
    Math.max(0, Number(goal.posted_occurrence_count || 0)),
  );
  const occurrenceStatus = goal.occurrence_status;
  const fixedScheduleDone = isFixed && completedContributions >= totalContributions;

  return (
    <ScheduledItemCard
      icon={goal.icon_key || "target"}
      color={color}
      title={goal.name}
      subtitle={
        isCompleted
          ? "100% complete"
          : isFixed && occurrenceStatus
            ? `${occurrenceStatus.label} · ${progress}% complete`
            : `${statusLabel} · ${progress}% complete`
      }
      meta={<>{isFixed && goal.duration_count ? `Contribution ${Math.min(totalContributions, completedContributions + 1)} of ${totalContributions} · Next ${goal.next_due_date || "No date"} · ` : ""}Target {formatCurrencyElement(target, currency)}</>}
      amount={
        isCompleted
          ? "Completed"
          : formatCurrencyElement(displayAmount, currency)
      }
      actions={
        <Button
          size="sm"
          onClick={() => onContribute(goal)}
          disabled={isCompleted || missingAccounts || fixedScheduleDone || saving}
          className="h-7 rounded-xl px-3 text-xs"
        >
          {saving
            ? "Saving…"
            : isCompleted
              ? "Done"
              : fixedScheduleDone
                ? "Done"
                : "Contribute"}
        </Button>
      }
    />
  );
}

export default function ScheduledGoalsList({
  activeGoals,
  accounts,
  currency,
  savingGoalId,
  contributionDialog,
  formatCurrencyElement,
}) {
  return (
    <section className="space-y-3">
      <div className="px-1">
        <h2 className="text-base font-semibold">Savings Goals</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Same goal rows as Manage Plan, with contribution actions for
          execution.
        </p>
      </div>

      {activeGoals.length === 0 ? (
        <div className="rounded-2xl app-card-surface p-4">
          <EmptyState
            icon={PiggyBank}
            title="No active savings goals"
            description="Create savings goals from Manage Plan before posting contributions."
          />
        </div>
      ) : (
        <ScheduledSectionCard
          type="active"
          label="Active Goals"
          count={activeGoals.length}
          defaultExpanded
          emptyText="No active savings goals right now."
        >
          {activeGoals.map((goal) => {
            const fromAccount = accounts.find(
              (account) => account.id === goal.from_account_id,
            );
            const toAccount = accounts.find(
              (account) => account.id === goal.to_account_id,
            );

            return (
              <ScheduledGoalRow
                key={goal.id}
                goal={goal}
                fromAccount={fromAccount}
                toAccount={toAccount}
                currency={currency}
                saving={savingGoalId === goal.id}
                onContribute={contributionDialog.openDialog}
                formatCurrencyElement={formatCurrencyElement}
              />
            );
          })}
        </ScheduledSectionCard>
      )}

      <GoalContributionDialog
        dialog={contributionDialog}
        accounts={accounts}
        currency={currency}
        saving={Boolean(savingGoalId)}
        formatCurrencyElement={formatCurrencyElement}
      />
    </section>
  );
}
