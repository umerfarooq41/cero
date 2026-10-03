import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { accountsApi, recurringTransactionsApi, transactionsApi } from "@/lib/budgetData";
import {
  calculateNextDueDate,
  getRecurringStatus,
  sortRecurringByDueDate,
  todayIsoDate,
} from "@/lib/recurringTransactions";
import {
  getRecurringMonthlyPlanAmount,
  getTransactionDeltas,
  isDueNow,
  isFlexibleCreditCardDebt,
  normalizeRuleType,
  RECURRING_SECTIONS,
  sumRecurringPostedByRule,
} from "./scheduledUtils";

function invalidateScheduledQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
  queryClient.invalidateQueries({ queryKey: ["all-transactions"] });
  queryClient.invalidateQueries({ queryKey: ["accounts"] });
  queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
  queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
  queryClient.invalidateQueries({ queryKey: ["goal-contributions"] });
  queryClient.invalidateQueries({ queryKey: ["allocations"] });
  queryClient.invalidateQueries({ queryKey: ["all-allocations"] });
  queryClient.invalidateQueries({ queryKey: ["budget-summary"] });
}

export async function updateAccountBalances(transactionPayload, accounts = []) {
  const deltas = getTransactionDeltas(transactionPayload, accounts);

  await Promise.all(
    Object.entries(deltas).map(([accountId, delta]) => {
      const account = accounts.find((item) => item.id === accountId);

      if (!account) return Promise.resolve();

      return accountsApi.update(accountId, {
        balance: (Number(account.balance) || 0) + delta,
      });
    }),
  );
}

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

  const activeRecurring = useMemo(
    () =>
      sortRecurringByDueDate(
        recurringTransactions
          .filter((rule) => !rule.is_archived)
          .map((rule) => {
            const toAccount = accounts.find(
              (account) => account.id === rule.to_account_id,
            );
            const plannedThisMonth = getRecurringMonthlyPlanAmount(
              rule,
              allocations,
            );
            const paidThisMonth = recurringPaymentsByRule[rule.id] || 0;
            const isFlexiblePayment = isFlexibleCreditCardDebt(rule, toAccount);

            return {
              ...rule,
              month_planned_amount: plannedThisMonth,
              month_paid_amount: paidThisMonth,
              month_remaining_amount: isFlexiblePayment
                ? Math.max(0, Number(plannedThisMonth || 0) - paidThisMonth)
                : null,
              is_flexible_payment: isFlexiblePayment,
              is_month_done: paidThisMonth > 0,
            };
          }),
      ),
    [accounts, allocations, recurringPaymentsByRule, recurringTransactions],
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

      if (!isDueNow(status)) {
        toast.error("This recurring item is not due yet");
        return;
      }

      if (!rule.account_id) {
        toast.error("This recurring rule is missing an account");
        return;
      }

      const transactionType = normalizeRuleType(rule.type);
      const destinationAccount = accounts.find((account) => account.id === rule.to_account_id);
      const isFiniteDebt =
        transactionType === "transfer" &&
        destinationAccount &&
        !isFlexibleCreditCardDebt(rule, destinationAccount);
      const outstandingDebt = isFiniteDebt
        ? Math.max(0, Number(destinationAccount.balance || 0))
        : null;

      if (isFiniteDebt && outstandingDebt <= 0) {
        await recurringTransactionsApi.update(rule.id, { is_active: false });
        invalidateScheduledQueries(queryClient);
        toast.success("Debt is paid off. Recurring rule completed.");
        return;
      }

      if (transactionType === "transfer" && !rule.to_account_id) {
        toast.error("This recurring transfer is missing a destination account");
        return;
      }

      setPostingId(rule.id);

      try {
        const postedForDate = rule.next_due_date || todayIsoDate();
        const scheduledAmount = Math.max(0, Number(rule.amount || 0));
        const postingAmount = isFiniteDebt
          ? Math.min(scheduledAmount, outstandingDebt)
          : scheduledAmount;
        const completesDebt = isFiniteDebt && postingAmount >= outstandingDebt;

        const transactionPayload = {
          amount: postingAmount,
          type: transactionType,
          date: postedForDate,
          note: rule.note || `${rule.name} · Recurring`,
          category_id: rule.category_id || null,
          account_id: rule.account_id || null,
          to_account_id:
            transactionType === "transfer" ? rule.to_account_id || null : null,
          recurring_transaction_id: rule.id,
          recurring_posted_for_date: postedForDate,
        };

        const transaction = await transactionsApi.create(transactionPayload);
        await updateAccountBalances(transactionPayload, accounts);

        await recurringTransactionsApi.update(rule.id, {
          last_posted_date: todayIsoDate(),
          last_posted_transaction_id: transaction.id,
          next_due_date: calculateNextDueDate(postedForDate, rule.frequency),
          ...(completesDebt ? { is_active: false, completed_at: todayIsoDate() } : {}),
        });

        invalidateScheduledQueries(queryClient);
        toast.success(completesDebt ? "Final debt payment posted. Plan completed." : "Recurring transaction posted");
      } catch (error) {
        console.error("Recurring post failed:", error);
        toast.error(error.message || "Could not post recurring transaction");
      } finally {
        setPostingId(null);
      }
    },
    [accounts, queryClient],
  );

  const submitPaymentDialog = useCallback(async () => {
    if (!selectedRecurringPayment) return;

    const rule = selectedRecurringPayment;
    const amount = Number(paymentAmount || 0);
    const fromAccount = accounts.find(
      (account) => account.id === rule.account_id,
    );
    const toAccount = accounts.find(
      (account) => account.id === rule.to_account_id,
    );
    const alreadyPaidThisMonth = Number(rule.month_paid_amount || 0);
    const plannedThisMonth = Number(
      rule.month_planned_amount || rule.amount || 0,
    );
    const wasMonthCovered =
      plannedThisMonth > 0 && alreadyPaidThisMonth >= plannedThisMonth;
    const willMonthBeCovered =
      plannedThisMonth > 0 && alreadyPaidThisMonth + amount >= plannedThisMonth;

    if (!amount || amount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    if (!fromAccount || !toAccount) {
      toast.error("This credit card payment is missing its from/to accounts");
      return;
    }

    if (fromAccount.id === toAccount.id) {
      toast.error("Payment from/to accounts must be different");
      return;
    }

    setPostingId(rule.id);

    try {
      const date = paymentDate || todayIsoDate();
      const postedForDate = rule.next_due_date || date;
      const note = paymentNote || `${rule.name} · Recurring`;

      const transactionPayload = {
        amount,
        type: "transfer",
        date,
        note,
        category_id: rule.category_id || null,
        account_id: fromAccount.id,
        to_account_id: toAccount.id,
        recurring_transaction_id: rule.id,
        recurring_posted_for_date: postedForDate,
      };

      const transaction = await transactionsApi.create(transactionPayload);
      await updateAccountBalances(transactionPayload, accounts);

      if (!wasMonthCovered && willMonthBeCovered) {
        await recurringTransactionsApi.update(rule.id, {
          last_posted_date: todayIsoDate(),
          last_posted_transaction_id: transaction.id,
          next_due_date: calculateNextDueDate(postedForDate, rule.frequency),
        });
      } else {
        await recurringTransactionsApi.update(rule.id, {
          last_posted_date: todayIsoDate(),
          last_posted_transaction_id: transaction.id,
        });
      }

      invalidateScheduledQueries(queryClient);
      closePaymentDialog();
      toast.success(
        willMonthBeCovered
          ? "Credit card payment posted"
          : "Partial credit card payment posted",
      );
    } catch (error) {
      console.error("Credit card payment failed:", error);
      toast.error(error.message || "Could not post credit card payment");
    } finally {
      setPostingId(null);
    }
  }, [
    accounts,
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
