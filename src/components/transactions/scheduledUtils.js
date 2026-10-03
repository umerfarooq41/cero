import { getGoalPlannedAmountForMonth } from "@/lib/goals";

export const RECURRING_SECTIONS = [
  { type: "income", label: "Income" },
  { type: "expense", label: "Expenses" },
  { type: "transfer", label: "Debt Payments" },
];

export function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

export function addDelta(deltas, accountId, amount) {
  if (!accountId || !amount) return;
  deltas[accountId] = (deltas[accountId] || 0) + amount;
}

export function getTransactionDeltas(transaction, accounts) {
  const deltas = {};
  const amount = Number(transaction.amount) || 0;

  const source = accounts.find(
    (account) => account.id === transaction.account_id,
  );
  const destination = accounts.find(
    (account) => account.id === transaction.to_account_id,
  );

  if (source) {
    const sourceDelta =
      transaction.type === "income"
        ? source.category === "liability"
          ? -amount
          : amount
        : source.category === "liability"
          ? amount
          : -amount;

    addDelta(deltas, source.id, sourceDelta);
  }

  if (transaction.type === "transfer" && destination) {
    const destinationDelta =
      destination.category === "liability" ? -amount : amount;
    addDelta(deltas, destination.id, destinationDelta);
  }

  return deltas;
}

export function getGoalContributionAmount(row) {
  return Math.max(0, Number(row?.amount || 0));
}

export function getGoalSourceId(row) {
  return row?.goal_id || row?.savings_goal_id || null;
}

export function isGoalFundUseTransaction(row) {
  const note = String(row?.note || "")
    .trim()
    .toLowerCase();

  return (
    row?.source_type === "goal_withdrawal" ||
    (note.startsWith("use ") && note.endsWith(" funds"))
  );
}

export function sumGoalContributionsByGoal(rows = []) {
  return rows.reduce((totals, row) => {
    const goalId = getGoalSourceId(row);
    if (!goalId) return totals;

    totals[goalId] = (totals[goalId] || 0) + getGoalContributionAmount(row);
    return totals;
  }, {});
}

export function sumGoalTransactionsByGoal(rows = []) {
  return rows.reduce((totals, row) => {
    const goalId = row?.savings_goal_id || row?.goal_id || null;
    if (!goalId || row?.type !== "transfer" || isGoalFundUseTransaction(row)) {
      return totals;
    }

    totals[goalId] =
      (totals[goalId] || 0) + Math.max(0, Number(row?.amount || 0));
    return totals;
  }, {});
}

export function sumGoalFundedTotalsByGoal(rows = []) {
  return rows.reduce((totals, row) => {
    const goalId = row?.savings_goal_id || row?.goal_id || null;
    if (!goalId || row?.type !== "transfer" || isGoalFundUseTransaction(row)) {
      return totals;
    }

    totals[goalId] =
      (totals[goalId] || 0) + Math.max(0, Number(row?.amount || 0));
    return totals;
  }, {});
}

export function sumRecurringPostedByRule(rows = []) {
  return rows.reduce((totals, row) => {
    const ruleId = row?.recurring_transaction_id || null;
    if (!ruleId) return totals;

    totals[ruleId] =
      (totals[ruleId] || 0) + Math.max(0, Number(row?.amount || 0));
    return totals;
  }, {});
}

export function countVerifiedRecurringOccurrencesByRule(rows = []) {
  const occurrences = new Map();

  rows.forEach((row) => {
    const ruleId = row?.recurring_transaction_id || null;
    if (!ruleId) return;

    // Only a transaction explicitly linked to the rule can verify payment.
    // Prefer the immutable scheduled occurrence date. For older linked rows
    // that predate that field, the transaction itself is still proof of one
    // posting, but it is never matched by amount/category/name.
    const occurrenceKey = row?.recurring_posted_for_date
      ? `due:${String(row.recurring_posted_for_date).slice(0, 10)}`
      : `tx:${row.id || `${row.date || ""}:${row.amount || ""}`}`;

    if (!occurrences.has(ruleId)) occurrences.set(ruleId, new Set());
    occurrences.get(ruleId).add(occurrenceKey);
  });

  return Object.fromEntries(
    [...occurrences.entries()].map(([ruleId, values]) => [ruleId, values.size]),
  );
}

export function countVerifiedGoalContributionsByGoal(rows = []) {
  return rows.reduce((totals, row) => {
    const goalId = row?.savings_goal_id || row?.goal_id || null;
    if (!goalId || row?.type !== "transfer" || isGoalFundUseTransaction(row)) {
      return totals;
    }

    // A goal occurrence is verified only by a transaction explicitly linked
    // to that goal. Do not infer contributions from amount/category/name.
    totals[goalId] = (totals[goalId] || 0) + 1;
    return totals;
  }, {});
}

export function getGoalPlanRow(goal, allocations = []) {
  return allocations.find((allocation) => {
    const sourceType = String(allocation?.source_type || "").toLowerCase();
    return (
      (sourceType === "goal" || sourceType === "savings_goal") &&
      allocation?.source_id === goal?.id
    );
  });
}

export function getGoalMonthlyPlanAmount(goal, allocations = [], currentMonth) {
  const planRow = getGoalPlanRow(goal, allocations);

  if (planRow) {
    return Math.max(0, Number(planRow.planned_amount || 0));
  }

  const fallback = getGoalPlannedAmountForMonth(goal, currentMonth);
  return fallback === null ? null : Math.max(0, Number(fallback || 0));
}

export function getRecurringPlanRow(rule, allocations = []) {
  return allocations.find((allocation) => {
    const sourceType = String(allocation?.source_type || "").toLowerCase();
    return (
      (sourceType === "recurring" || sourceType === "recurring_transaction") &&
      allocation?.source_id === rule?.id
    );
  });
}

export function getRecurringMonthlyPlanAmount(rule, allocations = []) {
  const planRow = getRecurringPlanRow(rule, allocations);

  if (planRow) {
    return Math.max(0, Number(planRow.planned_amount || 0));
  }

  return Math.max(0, Number(rule?.amount || 0));
}

export function isCreditCardAccount(account) {
  const type = String(account?.type || "").toLowerCase();
  return (
    type === "credit_card" || type === "credit-card" || type === "creditcard"
  );
}

export function isDebtAccount(account) {
  const category = String(account?.category || "").toLowerCase();
  const type = String(account?.type || "").toLowerCase();

  return (
    category === "liability" ||
    category === "debt" ||
    ["loan", "credit_card", "credit-card", "creditcard", "debt"].includes(type)
  );
}

export function normalizeRuleType(type) {
  if (type === "debt") return "transfer";
  return ["income", "expense", "transfer"].includes(type) ? type : "expense";
}

export function isFlexibleCreditCardDebt(rule, toAccount) {
  return (
    normalizeRuleType(rule?.type) === "transfer" &&
    isCreditCardAccount(toAccount)
  );
}

export function isDueNow(status) {
  return status.key === "overdue" || status.key === "due_today";
}
