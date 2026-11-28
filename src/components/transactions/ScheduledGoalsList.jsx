import ScheduledPostingDialog from './ScheduledPostingDialog';
import { SectionHeading } from '@/components/shared/WorkspacePrimitives';
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
} from "@/lib/goals";
import ScheduledItemCard, { ScheduledSectionCard, ScheduledAccordion } from "./ScheduledItemCard";

function GoalContributionDialog({dialog,accounts,currency,saving,formatCurrencyElement}) {
 const goal=dialog.goal;if(!goal)return null;
 const from=accounts.find(a=>a.id===goal.from_account_id),to=accounts.find(a=>a.id===goal.to_account_id);
 const fixed=(goal.contribution_mode||'flexible')==='fixed',remaining=Math.max(0,Number(dialog.remainingAmount||0));
 return <ScheduledPostingDialog key={goal.id} dialog={dialog} title={'Contribute to '+goal.name} description="Transfer funds to the linked savings goal." currency={currency} formatCurrencyElement={formatCurrencyElement} locked={fixed} lockedAmount={Math.min(Number(goal.fixed_contribution_amount||0),remaining)} scheduledDate={fixed?goal.next_due_date:null} accountLabel="Transfer path" accountText={(from?.name||'Missing account')+' → '+(to?.name||'Missing savings account')} details={[[ 'Remaining goal',formatCurrencyElement(remaining,currency)]]} saving={saving} disabled={!from||!to} actionLabel="Contribute" maxAmount={remaining}/>;
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
  const color = goal.color_key || "#276FE4";
  const isCompleted = remaining <= 0 || progress >= 100;
  const missingAccounts = !fromAccount || !toAccount;
  const plannedAmountRaw = goal.month_planned_amount;
  const plannedThisMonth = Number(plannedAmountRaw || 0);
  const hasMonthlyPlan = plannedAmountRaw !== null && plannedThisMonth > 0;
  const contributedThisMonth = Number(goal.month_contributed_amount || 0);
  const monthRemaining = hasMonthlyPlan
    ? Math.max(0, plannedThisMonth - contributedThisMonth)
    : null;
  const isFixed = (goal.contribution_mode || "flexible") === "fixed";
  const displayAmount = isFixed
    ? Math.min(Number(goal.fixed_contribution_amount || 0), remaining)
    : Math.min(Math.max(0, Number(goal.next_suggested_contribution ?? remaining)), remaining);
  const totalContributions = Math.max(1, Number(goal.duration_count || 0));
  const completedContributions = Math.min(
    totalContributions,
    Math.max(0, Number(goal.posted_occurrence_count || 0)),
  );
  const occurrenceStatus = goal.occurrence_status;
  const fixedScheduleDone = isFixed && completedContributions >= totalContributions;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysUntil = (value) => value
    ? Math.ceil((new Date(`${value}T00:00:00`).getTime() - todayStart.getTime()) / 86400000)
    : null;
  const monthsFromDays = (days) => Math.max(1, Math.ceil(days / 30.44));

  const flexibleDaysLeft = daysUntil(goal.target_date);
  const flexibleCountdown = flexibleDaysLeft === null
    ? null
    : flexibleDaysLeft > 0
      ? flexibleDaysLeft < 30
        ? `${flexibleDaysLeft}d left`
        : `${monthsFromDays(flexibleDaysLeft)} mo left`
      : flexibleDaysLeft === 0
        ? "Due today"
        : `${Math.abs(flexibleDaysLeft)}d overdue`;

  const fixedDaysLeft = daysUntil(goal.next_due_date);
  const fixedUsesMonths = ["quarterly", "yearly"].includes(goal.frequency);
  const fixedCountdown = fixedDaysLeft === null
    ? occurrenceStatus?.label || null
    : fixedDaysLeft > 0
      ? fixedUsesMonths
        ? `Due in ${monthsFromDays(fixedDaysLeft)} mo`
        : `Due in ${fixedDaysLeft}d`
      : fixedDaysLeft === 0
        ? "Due today"
        : `Overdue ${Math.abs(fixedDaysLeft)}d`;

  return (
    <ScheduledItemCard
      icon={goal.icon_key || "target"}
      color={color}
      title={goal.name}
      details={[
        ["Contribution", formatCurrencyElement(displayAmount, currency)],
        ["Frequency", goal.frequency],
        ["Next due date", goal.next_due_date],
        ["Target date", goal.target_date],
        ["From account", fromAccount?.name],
        ["Savings account", toAccount?.name],
        ["Target amount", formatCurrencyElement(target, currency)],
        ["Total funded", formatCurrencyElement(Math.max(0,target-remaining), currency)],
        ["Remaining", formatCurrencyElement(remaining, currency)],
        ["Progress", `${progress}%`],
      ]}
      subtitle={
        isCompleted
          ? "100%"
          : isFixed && fixedCountdown
            ? `${progress}% · ${fixedCountdown}`
            : `${progress}%${flexibleCountdown ? ` · ${flexibleCountdown}` : ""}`
      }
      meta={
        <>
          {formatCurrencyElement(Math.max(0, target - remaining), currency)} / {Number(target).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </>
      }
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
          className="h-8 rounded-md px-3 text-xs"
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

function FlatGoalSection({ children }) {
  return <ScheduledAccordion><div className="divide-y divide-border/50">{children}</div></ScheduledAccordion>;
}

export default function ScheduledGoalsList({
  desktop = false,
  activeGoals,
  accounts,
  currency,
  savingGoalId,
  contributionDialog,
  formatCurrencyElement,
}) {
  const Wrapper = desktop ? FlatGoalSection : ScheduledSectionCard;
  return (
    <section className="space-y-3">
      <div className={desktop?"hidden":"px-0"}>
        <SectionHeading title="Savings goals" icon={PiggyBank}/>
        <p className="mt-1 text-xs text-muted-foreground">
          Same goal rows as Manage Plan, with contribution actions for
          execution.
        </p>
      </div>

      {activeGoals.length === 0 ? (
        <div className="py-3">
          <EmptyState
            icon={PiggyBank}
            title="No active savings goals"
            description="Create savings goals from Manage Plan before posting contributions."
          />
        </div>
      ) : (
        <Wrapper
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
        </Wrapper>
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
