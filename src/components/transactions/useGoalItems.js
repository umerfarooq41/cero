import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getFixedGoalContributionAmount,
  getGoalOccurrenceStatus,
  getGoalProgress,
  getGoalRemaining,
  sortGoalsByPriority,
  todayIsoDate,
} from "@/lib/goals";
import {
  invalidateGoalContributionQueries,
  postGoalContribution,
} from "@/lib/goalContributionEffects";
import {
  countVerifiedGoalContributionsByGoal,
  getGoalMonthlyPlanAmount,
  sumGoalFundedTotalsByGoal,
  sumGoalTransactionsByGoal,
} from "./scheduledUtils";

function getSuggestedContributionAmount(goal) {
  if (!goal) return "";

  const remainingThisMonth = Number(goal.month_remaining_amount || 0);
  if (remainingThisMonth > 0) return String(remainingThisMonth);

  const plannedThisMonth = Number(goal.month_planned_amount || 0);
  const contributedThisMonth = Number(goal.month_contributed_amount || 0);
  if (plannedThisMonth > 0 && contributedThisMonth <= 0) {
    return String(plannedThisMonth);
  }

  return "";
}

export default function useGoalItems({
  savingsGoals = [],
  allocations = [],
  currentMonth,
  monthTransactions = [],
  allTransactions = [],
  accounts = [],
  categories = [],
}) {
  const queryClient = useQueryClient();
  const [savingGoalId, setSavingGoalId] = useState(null);

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionDate, setContributionDate] = useState(todayIsoDate());
  const [contributionNote, setContributionNote] = useState("");

  const monthContributionsByGoal = useMemo(
    () => sumGoalTransactionsByGoal(monthTransactions),
    [monthTransactions],
  );

  const fundedTotalsByGoal = useMemo(
    () => sumGoalFundedTotalsByGoal(allTransactions),
    [allTransactions],
  );

  const verifiedContributionsByGoal = useMemo(
    () => countVerifiedGoalContributionsByGoal(allTransactions),
    [allTransactions],
  );

  const activeGoals = useMemo(
    () =>
      sortGoalsByPriority(
        savingsGoals
          .filter((goal) => !goal.is_archived)
          .map((goal) => {
            const startingAmount = Math.max(
              0,
              Number(goal.starting_amount || 0),
            );
            const fundedAmount =
              startingAmount + Number(fundedTotalsByGoal[goal.id] || 0);
            const currentAmount = Math.max(0, Number(goal.current_amount || 0));
            const goalWithProgress = {
              ...goal,
              current_amount: currentAmount,
              funded_amount: Math.max(0, fundedAmount),
            };
            const plannedThisMonth = getGoalMonthlyPlanAmount(
              goalWithProgress,
              allocations,
              currentMonth,
            );
            const contributedThisMonth = monthContributionsByGoal[goal.id] || 0;
            const hasMonthlyPlan =
              plannedThisMonth !== null && Number(plannedThisMonth || 0) > 0;
            const monthRemainingAmount = hasMonthlyPlan
              ? Math.max(
                  0,
                  Number(plannedThisMonth || 0) - contributedThisMonth,
                )
              : null;
            const progress = getGoalProgress(goalWithProgress);
            const remaining = getGoalRemaining(goalWithProgress);

            const contributionMode = goal.contribution_mode || "flexible";
            const fixedAmount = contributionMode === "fixed" ? getFixedGoalContributionAmount(goalWithProgress) : 0;
            const postedOccurrences = Math.max(
              0,
              Number(verifiedContributionsByGoal[goal.id] || 0),
            );
            // For fixed goals the database owns schedule state. Never
            // reconstruct next_due_date from transaction counts here: deleted,
            // early, or out-of-order occurrences can make that calculation
            // disagree with the atomic posting/deletion RPCs.
            const nextDueDate = contributionMode === "fixed"
              ? (goal.next_due_date || null)
              : null;
            return {
              ...goalWithProgress,
              contribution_mode: contributionMode,
              fixed_contribution_amount: fixedAmount,
              posted_occurrence_count: postedOccurrences,
              next_due_date: nextDueDate,
              occurrence_status: contributionMode === "fixed"
                ? getGoalOccurrenceStatus({ ...goalWithProgress, next_due_date: nextDueDate })
                : null,
              month_planned_amount: plannedThisMonth,
              month_contributed_amount: contributedThisMonth,
              month_remaining_amount: monthRemainingAmount,
              is_completed: remaining <= 0 || progress >= 100,
            };
          })
          .filter((goal) => !goal.is_completed),
      ),
    [
      allocations,
      currentMonth,
      fundedTotalsByGoal,
      monthContributionsByGoal,
      savingsGoals,
      verifiedContributionsByGoal,
    ],
  );

  const openContributionDialog = useCallback((goal) => {
    const isFixed = (goal?.contribution_mode || "flexible") === "fixed";
    const totalOccurrences = Math.max(0, Number(goal?.duration_count || 0));
    const postedOccurrences = Math.max(0, Number(goal?.posted_occurrence_count || 0));
    if (isFixed && totalOccurrences > 0 && postedOccurrences >= totalOccurrences) {
      toast.error("All scheduled contributions are complete");
      return;
    }
    setSelectedGoal(goal);
    setContributionAmount(isFixed ? String(goal?.fixed_contribution_amount || "") : getSuggestedContributionAmount(goal));
    // The scheduled occurrence date and the date money actually moves are
    // separate. Fixed contributions can be paid early, including several
    // future installments on the same day.
    setContributionDate(todayIsoDate());
    setContributionNote(goal ? `Contribution to ${goal.name}` : "");
  }, []);

  const closeContributionDialog = useCallback(() => {
    setSelectedGoal(null);
    setContributionAmount("");
    setContributionDate(todayIsoDate());
    setContributionNote("");
  }, []);

  const submitContribution = useCallback(async () => {
    if (!selectedGoal) return;

    const isFixed = (selectedGoal.contribution_mode || "flexible") === "fixed";
    const fixedAmount = Math.min(
      Number(selectedGoal.fixed_contribution_amount || 0),
      getGoalRemaining(selectedGoal),
    );
    const requestedAmount = Number(contributionAmount || 0);
    const remainingAmount = getGoalRemaining(selectedGoal);
    if (isFixed && fixedAmount <= 0) {
      toast.error("This scheduled contribution is already complete");
      return;
    }
    if (!isFixed && requestedAmount > remainingAmount) {
      toast.error(`Maximum contribution is ${remainingAmount.toFixed(2)}`);
      return;
    }
    setSavingGoalId(selectedGoal.id);

    try {
      await postGoalContribution({
        goal: selectedGoal,
        amount: isFixed ? fixedAmount : requestedAmount,
        date: contributionDate,
        note: contributionNote,
        accounts,
        categories,
        allocations,
        month: currentMonth,
      });

      invalidateGoalContributionQueries(queryClient);
      closeContributionDialog();
      toast.success("Goal contribution posted");
    } catch (error) {
      console.error("Goal contribution failed:", error);
      toast.error(error.message || "Could not post goal contribution");
    } finally {
      setSavingGoalId(null);
    }
  }, [
    accounts,
    allocations,
    categories,
    closeContributionDialog,
    contributionAmount,
    contributionDate,
    contributionNote,
    currentMonth,
    queryClient,
    selectedGoal,
  ]);

  return {
    activeGoals,
    monthContributionsByGoal,
    fundedTotalsByGoal,
    savingGoalId,
    contributionDialog: {
      goal: selectedGoal,
      open: Boolean(selectedGoal),
      amount: contributionAmount,
      date: contributionDate,
      note: contributionNote,
      setAmount: setContributionAmount,
      setDate: setContributionDate,
      setNote: setContributionNote,
      openDialog: openContributionDialog,
      closeDialog: closeContributionDialog,
      submit: submitContribution,
      suggestedAmount: getSuggestedContributionAmount(selectedGoal),
      remainingAmount: selectedGoal ? getGoalRemaining(selectedGoal) : 0,
    },
  };
}
