import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { invalidateScheduledQueries } from "@/lib/queryInvalidation";
import {
  getFixedDebtNextDueDate,
  getRecurringStatus,
  sortRecurringByDueDate,
  todayIsoDate,
} from "@/lib/recurringTransactions";
import {
  countVerifiedRecurringOccurrencesByRule,
  getRecurringMonthlyPlanAmount,
  isDueNow,
  normalizeRuleType,
  RECURRING_SECTIONS,
  sumRecurringPostedByRule,
} from "./scheduledUtils";

function getSuggestedPaymentAmount(rule) {
  if (!rule) return "";

  const plannedAmount = Number(rule.month_planned_amount || rule.amount || 0);
  const paidThisMonth = Number(rule.month_paid_amount || 0);
  const remainingAmount = Math.max(0, plannedAmount - paidThisMonth);

  return remainingAmount > 0 ? String(remainingAmount) : "";
}

export default function useRecurringItems({
  recurringTransactions = [],
  accounts = [],
  allocations = [],
  monthTransactions = [],
  allTransactions = [],
}) {
  const queryClient = useQueryClient();
  const [postingId, setPostingId] = useState(null);
  const [selectedRecurringPayment, setSelectedRecurringPayment] =
    useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayIsoDate());
  const [paymentNote, setPaymentNote] = useState("");

  const recurringPaymentsByRule = useMemo(
    () => sumRecurringPostedByRule(monthTransactions),
    [monthTransactions],
  );
  const allRecurringPaymentsByRule = useMemo(
    () => sumRecurringPostedByRule(allTransactions),
    [allTransactions],
  );
  const verifiedOccurrencesByRule = useMemo(
    () => countVerifiedRecurringOccurrencesByRule(allTransactions),
    [allTransactions],
  );

  const activeRecurring = useMemo(
    () =>
      sortRecurringByDueDate(
        recurringTransactions
          .filter((rule) => !rule.is_archived)
          .filter((rule) => {
            const finiteDebt = normalizeRuleType(rule.type) === "transfer";
            const totalDebt = Math.max(0, Number(rule.total_amount || 0));
            const paidTotal = Math.max(0, Number(allRecurringPaymentsByRule[rule.id] || 0));
            const debtPaidOff = finiteDebt && totalDebt > 0 && paidTotal >= totalDebt - 0.005;

            // The recurring plan is the source of truth. A liability account can start at
            // zero, so never hide an unpaid plan merely because its account balance is zero.
            return !debtPaidOff && !rule.completed_at;
          })
          .map((rule) => {
            const toAccount = accounts.find(
              (account) => account.id === rule.to_account_id,
            );
            const plannedThisMonth = getRecurringMonthlyPlanAmount(
              rule,
              allocations,
            );
            const paidThisMonth = recurringPaymentsByRule[rule.id] || 0;
            const paidTotal = allRecurringPaymentsByRule[rule.id] || 0;
            const totalDebt = Math.max(0, Number(rule.total_amount || 0));
            const postedOccurrences = Math.max(0, Number(verifiedOccurrencesByRule[rule.id] || 0));
            const isFlexiblePayment = normalizeRuleType(rule.type) === "transfer" && (rule.payment_mode || "fixed") === "flexible";

            return {
              ...rule,
              next_due_date:
                normalizeRuleType(rule.type) === "transfer" &&
                (rule.payment_mode || "fixed") === "fixed"
                  ? getFixedDebtNextDueDate(rule, postedOccurrences)
                  : rule.next_due_date,
              posted_occurrence_count: postedOccurrences,
              month_planned_amount: plannedThisMonth,
              month_paid_amount: paidThisMonth,
              total_paid_amount: paidTotal,
              debt_remaining_amount: totalDebt > 0 ? Math.max(0, totalDebt - paidTotal) : null,
              month_remaining_amount: isFlexiblePayment
                ? Math.max(0, Number(plannedThisMonth || 0) - paidThisMonth)
                : null,
              is_flexible_payment: isFlexiblePayment,
              is_month_done: paidThisMonth > 0,
            };
          }),
      ),
    [accounts, allocations, allRecurringPaymentsByRule, recurringPaymentsByRule, recurringTransactions, verifiedOccurrencesByRule],
  );

  const recurringByType = useMemo(() => {
    return RECURRING_SECTIONS.reduce((groups, section) => {
      groups[section.type] = activeRecurring.filter(
        (rule) => normalizeRuleType(rule.type) === section.type,
      );
      return groups;
    }, {});
  }, [activeRecurring]);

  const openPaymentDialog = useCallback((rule) => {
    setSelectedRecurringPayment(rule);
    setPaymentAmount(getSuggestedPaymentAmount(rule));
    setPaymentDate(todayIsoDate());
    setPaymentNote(rule ? `${rule.name} · Recurring` : "");
  }, []);

  const closePaymentDialog = useCallback(() => {
    setSelectedRecurringPayment(null);
    setPaymentAmount("");
    setPaymentDate(todayIsoDate());
    setPaymentNote("");
  }, []);

  const postRecurring = useCallback(
    async (rule) => {
      const status = getRecurringStatus(rule);

      if (!rule.is_active) {
        toast.error("This recurring rule is paused");
        return;
      }

      const isDebt = normalizeRuleType(rule.type) === "transfer";
      const isFixedDebt = isDebt && (rule.payment_mode || "fixed") === "fixed";

      if (!isDueNow(status) && !isFixedDebt) {
        toast.error("This recurring item is not due yet");
        return;
      }

      if (!rule.account_id) {
        toast.error("This recurring rule is missing an account");
        return;
      }

      if (normalizeRuleType(rule.type) === "transfer" && !rule.to_account_id) {
        toast.error("This recurring transfer is missing a destination account");
        return;
      }

      setPostingId(rule.id);

      try {
        const postedOccurrences = Math.max(
          0,
          Number(verifiedOccurrencesByRule[rule.id] || 0),
        );
        const postedForDate = isFixedDebt
          ? getFixedDebtNextDueDate(rule, postedOccurrences)
          : rule.next_due_date || todayIsoDate();

        const { error } = await supabase.rpc("cero_post_recurring_transaction", {
          p_recurring_transaction_id: rule.id,
          p_amount: null,
          p_transaction_date: todayIsoDate(),
          p_posted_for_date: postedForDate,
          p_note: rule.note || `${rule.name} · Recurring`,
        });

        if (error) throw error;

        invalidateScheduledQueries(queryClient);
        toast.success("Recurring transaction posted");
      } catch (error) {
        console.error("Recurring post failed:", error);
        toast.error(error.message || "Could not post recurring transaction");
      } finally {
        setPostingId(null);
      }
    },
    [queryClient, verifiedOccurrencesByRule],
  );

  const submitPaymentDialog = useCallback(async () => {
    if (!selectedRecurringPayment) return;

    const rule = selectedRecurringPayment;
    const type = normalizeRuleType(rule.type);
    const isIncome = type === "income";
    const requestedAmount = Number(paymentAmount || 0);
    const fromAccount = accounts.find((account) => account.id === rule.account_id);
    const toAccount = accounts.find((account) => account.id === rule.to_account_id);
    const alreadyPostedThisMonth = Number(rule.month_paid_amount || 0);
    const plannedThisMonth = Number(rule.month_planned_amount || rule.amount || 0);
    const willMonthBeCovered =
      plannedThisMonth > 0 &&
      alreadyPostedThisMonth + requestedAmount >= plannedThisMonth - 0.005;

    if (!requestedAmount || requestedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (!fromAccount) {
      toast.error(isIncome ? "This income is missing its account" : "This payment is missing its from account");
      return;
    }

    if (!isIncome && !toAccount) {
      toast.error("This credit card payment is missing its destination account");
      return;
    }

    if (!isIncome && fromAccount.id === toAccount.id) {
      toast.error("Payment from/to accounts must be different");
      return;
    }

    let amount = requestedAmount;
    let completesDebt = false;

    if (!isIncome) {
      const totalDebt = Math.max(0, Number(rule.total_amount || 0));
      const paidTotal = Math.max(0, Number(allRecurringPaymentsByRule[rule.id] || 0));
      const outstandingDebt =
        totalDebt > 0
          ? Math.max(0, totalDebt - paidTotal)
          : Math.max(0, Number(toAccount?.balance || 0));

      if (outstandingDebt <= 0.005) {
        toast.error("This debt is already paid off");
        return;
      }

      amount = Math.min(requestedAmount, outstandingDebt);
      completesDebt = amount >= outstandingDebt - 0.005;
    }

    setPostingId(rule.id);

    try {
      const date = paymentDate || todayIsoDate();
      const postedForDate = rule.next_due_date || date;
      const note = paymentNote || `${rule.name} · Recurring`;

      const { error } = await supabase.rpc("cero_post_recurring_transaction", {
        p_recurring_transaction_id: rule.id,
        p_amount: amount,
        p_transaction_date: date,
        p_posted_for_date: postedForDate,
        p_note: note,
      });

      if (error) throw error;

      invalidateScheduledQueries(queryClient);
      closePaymentDialog();

      if (isIncome) {
        toast.success(willMonthBeCovered ? "Income received" : "Partial income received");
      } else {
        toast.success(
          completesDebt
            ? "Final debt payment posted. Plan completed."
            : willMonthBeCovered
              ? "Debt payment posted"
              : "Partial debt payment posted",
        );
      }
    } catch (error) {
      console.error(isIncome ? "Recurring income failed:" : "Credit card payment failed:", error);
      toast.error(error.message || (isIncome ? "Could not post recurring income" : "Could not post credit card payment"));
    } finally {
      setPostingId(null);
    }
  }, [
    accounts,
    allRecurringPaymentsByRule,
    closePaymentDialog,
    paymentAmount,
    paymentDate,
    paymentNote,
    queryClient,
    selectedRecurringPayment,
  ]);

  return {
    activeRecurring,
    recurringByType,
    recurringPaymentsByRule,
    postingId,
    paymentDialog: {
      rule: selectedRecurringPayment,
      open: Boolean(selectedRecurringPayment),
      amount: paymentAmount,
      date: paymentDate,
      note: paymentNote,
      setAmount: setPaymentAmount,
      setDate: setPaymentDate,
      setNote: setPaymentNote,
      openDialog: openPaymentDialog,
      closeDialog: closePaymentDialog,
      submit: submitPaymentDialog,
    },
    postRecurring,
  };
}
