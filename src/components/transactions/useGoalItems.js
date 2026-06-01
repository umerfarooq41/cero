import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { sortGoalsByPriority, todayIsoDate } from "@/lib/goals";
import {
  invalidateGoalContributionQueries,
  postGoalContribution,
  postGoalFundUse,
} from "@/lib/goalContributionEffects";
import {
  getGoalMonthlyPlanAmount,
  isDebtAccount,
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
  const [usingGoalFundsId, setUsingGoalFundsId] = useState(null);

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionDate, setContributionDate] = useState(todayIsoDate());
  const [contributionNote, setContributionNote] = useState("");

  const [selectedGoalFundUse, setSelectedGoalFundUse] = useState(null);
  const [fundUseAmount, setFundUseAmount] = useState("");
  const [fundUseDate, setFundUseDate] = useState(todayIsoDate());
  const [fundUseNote, setFundUseNote] = useState("");
  const [fundUseToAccountId, setFundUseToAccountId] = useState("");

  const debtAccounts = useMemo(
    () => accounts.filter((account) => isDebtAccount(account)),
    [accounts],
  );

  const monthContributionsByGoal = useMemo(
    () => sumGoalTransactionsByGoal(monthTransactions),
    [monthTransactions],
  );

  const fundedTotalsByGoal = useMemo(
    () => sumGoalFundedTotalsByGoal(allTransactions),
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
            const goalWithProgress = {
              ...goal,
              current_amount: Math.max(0, Number(goal.current_amount || 0)),
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

            return {
              ...goalWithProgress,
              month_planned_amount: plannedThisMonth,
              month_contributed_amount: contributedThisMonth,
              month_remaining_amount: monthRemainingAmount,
            };
          }),
      ),
    [
      allocations,
      currentMonth,
      fundedTotalsByGoal,
      monthContributionsByGoal,
      savingsGoals,
    ],
  );

  const openContributionDialog = useCallback((goal) => {
    setSelectedGoal(goal);
    setContributionAmount(getSuggestedContributionAmount(goal));
    setContributionDate(todayIsoDate());
    setContributionNote(goal ? `Contribution to ${goal.name}` : "");
  }, []);

  const closeContributionDialog = useCallback(() => {
    setSelectedGoal(null);
    setContributionAmount("");
    setContributionDate(todayIsoDate());
    setContributionNote("");
  }, []);

  const openFundUseDialog = useCallback(
    (goal) => {
      const availableAmount = Math.max(0, Number(goal?.current_amount || 0));

      setSelectedGoalFundUse(goal);
      setFundUseAmount(availableAmount ? String(availableAmount) : "");
      setFundUseDate(todayIsoDate());
      setFundUseNote(goal ? `Use ${goal.name} funds` : "");
      setFundUseToAccountId(debtAccounts[0]?.id || "");
    },
    [debtAccounts],
  );

  const closeFundUseDialog = useCallback(() => {
    setSelectedGoalFundUse(null);
    setFundUseAmount("");
    setFundUseDate(todayIsoDate());
    setFundUseNote("");
    setFundUseToAccountId("");
  }, []);

  const submitContribution = useCallback(async () => {
    if (!selectedGoal) return;

    setSavingGoalId(selectedGoal.id);

    try {
      await postGoalContribution({
        goal: selectedGoal,
        amount: Number(contributionAmount || 0),
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

  const submitFundUse = useCallback(async () => {
    if (!selectedGoalFundUse) return;

    setUsingGoalFundsId(selectedGoalFundUse.id);

    try {
      await postGoalFundUse({
        goal: selectedGoalFundUse,
        amount: Number(fundUseAmount || 0),
        date: fundUseDate,
        note: fundUseNote,
        toAccountId: fundUseToAccountId,
        accounts,
        categories,
      });

      invalidateGoalContributionQueries(queryClient);
      closeFundUseDialog();
      toast.success("Saved funds used");
    } catch (error) {
      console.error("Goal fund use failed:", error);
      toast.error(error.message || "Could not use saved funds");
    } finally {
      setUsingGoalFundsId(null);
    }
  }, [
    accounts,
    categories,
    closeFundUseDialog,
    fundUseAmount,
    fundUseDate,
    fundUseNote,
    fundUseToAccountId,
    queryClient,
    selectedGoalFundUse,
  ]);

  return {
    activeGoals,
    monthContributionsByGoal,
    fundedTotalsByGoal,
    savingGoalId,
    usingGoalFundsId,
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
    },
    fundUseDialog: {
      goal: selectedGoalFundUse,
      open: Boolean(selectedGoalFundUse),
      amount: fundUseAmount,
      date: fundUseDate,
      note: fundUseNote,
      toAccountId: fundUseToAccountId,
      setAmount: setFundUseAmount,
      setDate: setFundUseDate,
      setNote: setFundUseNote,
      setToAccountId: setFundUseToAccountId,
      openDialog: openFundUseDialog,
      closeDialog: closeFundUseDialog,
      submit: submitFundUse,
      debtAccounts,
    },
  };
}
