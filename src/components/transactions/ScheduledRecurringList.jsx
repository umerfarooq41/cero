import ScheduledPostingDialog from './ScheduledPostingDialog';
import { SectionHeading } from '@/components/shared/WorkspacePrimitives';
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
  ScheduledAccordion,
  ScheduledStatusBadge,
} from "./ScheduledItemCard";

function RecurringPaymentDialog({dialog,accounts,categories,currency,formatCurrencyElement,saving}) {
 const rule=dialog.rule;if(!rule)return null;
 const type=normalizeRuleType(rule.type),isIncome=type==='income',isDebt=type==='transfer',flexible=isDebt&&(rule.payment_mode||'fixed')==='flexible',locked=!isIncome&&!flexible;
 const from=accounts.find(a=>a.id===rule.account_id),to=accounts.find(a=>a.id===rule.to_account_id),category=categories.find(c=>c.id===rule.category_id);
 const planned=Number(rule.month_planned_amount||rule.amount||0),paid=Number(rule.month_paid_amount||0),remaining=Math.max(0,planned-paid);
 return <ScheduledPostingDialog key={rule.id} dialog={dialog} title={isIncome?'Receive '+rule.name:isDebt?'Pay '+rule.name:'Post '+rule.name} description="Confirm the linked scheduled transaction." currency={currency} formatCurrencyElement={formatCurrencyElement} locked={locked} lockedAmount={Number(rule.amount||0)} scheduledDate={rule.next_due_date} accountLabel={isDebt?'Payment path':isIncome?'Deposit account':'Payment account'} accountText={isDebt?(from?.name||'Missing account')+' → '+(to?.name||'Missing destination'):from?.name||'Missing account'} details={[[ 'Category',category?.name],...(isIncome||flexible?[['Planned this month',formatCurrencyElement(planned,currency)],['Already posted',formatCurrencyElement(paid,currency)],['Remaining this month',formatCurrencyElement(remaining,currency)]]:[])]} saving={saving} disabled={!from||(isDebt&&!to)} actionLabel={isIncome?'Receive income':isDebt?flexible?(remaining>0?'Pay':'Add extra'):'Pay installment':'Post expense'}/>;
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
  const isIncome = type === "income";
  const flexibleCreditCard = isDebt && (rule.payment_mode || "fixed") === "flexible";
  const fixedDebt = isDebt && !flexibleCreditCard;
  const plannedThisMonth = Number(rule.month_planned_amount ?? baseAmount);
  const paidThisMonth = Number(rule.month_paid_amount || 0);
  const monthRemaining = Math.max(0, plannedThisMonth - paidThisMonth);
  const isMonthCovered =
    (flexibleCreditCard || isIncome) && plannedThisMonth > 0 && monthRemaining <= 0.005;
  const displayAmount = (flexibleCreditCard || isIncome)
    ? isMonthCovered
      ? plannedThisMonth
      : monthRemaining
    : baseAmount;
  const fallbackIcon =
    type === "income" ? "income" : type === "transfer" ? "loan" : "receipt";
  const buttonLabel = isIncome
    ? posting ? "Saving…" : isMonthCovered ? "Received" : !dueNow ? "Upcoming" : paidThisMonth > 0 ? "Receive remaining" : "Receive"
    : flexibleCreditCard
      ? posting ? "Saving…" : isMonthCovered ? "Add extra" : "Pay"
    : fixedDebt
      ? posting ? "Posting…" : dueNow ? "Pay installment" : "Pay next early"
      : posting ? "Posting…" : dueNow ? "Post" : "Upcoming";
  const canUseAction = isIncome
    ? !isMonthCovered && dueNow && !posting && rule.is_active && Boolean(rule.account_id)
    : flexibleCreditCard
      ? rule.is_active && !posting && Boolean(rule.account_id && rule.to_account_id)
    : fixedDebt
      ? rule.is_active && !posting && Boolean(rule.account_id && rule.to_account_id)
      : dueNow && !posting && rule.is_active;
  const debtTotal = Math.max(0, Number(rule.total_amount || rule.total_debt || 0));
  const debtPaid = Math.max(
    0,
    Number(rule.paid_amount || rule.total_paid_amount || rule.completed_amount || 0),
  );
  const fixedPaidCount = Math.min(
    Math.max(0, Number(rule.duration_count || 0)),
    Math.max(0, Number(rule.posted_occurrence_count || 0)),
  );
  const debtProgressMeta = fixedDebt && rule.duration_count
    ? `${fixedPaidCount} of ${rule.duration_count} paid`
    : flexibleCreditCard && debtTotal > 0
      ? `${formatCurrencyElement(debtPaid, currency)} / ${debtTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} paid`
      : null;

  const handleAction = () => {
    paymentDialog.openDialog(rule);
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
      details={[
        ["Scheduled amount", formatCurrencyElement(baseAmount, currency)],
        ["Frequency", getRecurringFrequencyLabel(rule.frequency)],
        ["Next due date", rule.next_due_date],
        [isIncome ? "Deposit account" : "Payment account", account?.name],
        ["Destination account", toAccount?.name],
        ["Last posted", rule.last_posted_date],
        ...(isDebt && debtTotal > 0 ? [["Total debt", formatCurrencyElement(debtTotal, currency)], ["Total paid", formatCurrencyElement(debtPaid, currency)], ["Remaining debt", formatCurrencyElement(Math.max(0,debtTotal-debtPaid), currency)]] : []),
        ["Note", rule.note],
      ]}
      subtitle={
        <div className="flex min-w-0 items-center gap-1.5 truncate">
          <span className="truncate">
            {getRecurringFrequencyLabel(rule.frequency)} · {isIncome && isMonthCovered ? "Received this month" : status.label}
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
          {isDebt && debtProgressMeta
            ? debtProgressMeta
            : account?.name || "Account"}
        </>
      }
      amount={formatCurrencyElement(displayAmount, currency)}
      actions={
        <Button
          size="sm"
          variant={dueNow || flexibleCreditCard ? "default" : "secondary"}
          onClick={handleAction}
          disabled={!canUseAction}
          className="h-8 rounded-md px-3 text-xs"
        >
          {buttonLabel}
        </Button>
      }
    />
  );
}

function FlatScheduledSection({ count, emptyText, children }) {
  return count ? <ScheduledAccordion><div className="divide-y divide-border/50">{children}</div></ScheduledAccordion> : <p className="py-3 text-center text-xs text-muted-foreground">{emptyText}</p>;
}

export default function ScheduledRecurringList({
  desktopSection = null,
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
      <div className={desktopSection?"hidden":"px-0"}>
        <SectionHeading title="Recurring bills & income" icon={Clock3}/>
        <p className="mt-1 text-xs text-muted-foreground">
          Same layout as Manage Plan, with posting actions only for due items.
        </p>
      </div>

      {activeRecurring.length === 0 ? (
        <div className="py-3">
          <EmptyState
            icon={Clock3}
            title="No recurring rules"
            description="Create recurring income, bills, and debt rules from Manage Plan first."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {RECURRING_SECTIONS.filter(section=>!desktopSection||section.type===desktopSection).map((section) => {
            const rules = recurringByType[section.type] || [];

            const Wrapper = desktopSection ? FlatScheduledSection : ScheduledSectionCard;
            return (
              <Wrapper
                key={section.type}
                type={section.type}
                label={section.label}
                count={rules.length}
                defaultExpanded={Boolean(desktopSection) || section.type === "expense" || rules.length > 0}
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
              
              </Wrapper>
            );
          })}
        </div>
      )}

      <RecurringPaymentDialog
        dialog={paymentDialog}
        accounts={accounts}
        categories={categories}
        currency={currency}
        formatCurrencyElement={formatCurrencyElement}
        saving={Boolean(postingId)}
      />
    </section>
  );
}
