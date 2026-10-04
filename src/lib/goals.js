export function todayIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getGoalStartDate(goal) {
  return goal?.start_date || goal?.created_at?.slice?.(0, 10) || todayIsoDate();
}

export function addGoalOccurrence(dateValue, frequency = 'monthly', count = 1) {
  const date = new Date(`${String(dateValue || todayIsoDate()).slice(0, 10)}T00:00:00`);
  const steps = Math.max(0, Math.floor(Number(count || 0)));

  for (let index = 0; index < steps; index += 1) {
    if (frequency === 'weekly') date.setDate(date.getDate() + 7);
    else if (frequency === 'biweekly') date.setDate(date.getDate() + 14);
    else if (frequency === 'quarterly') date.setMonth(date.getMonth() + 3);
    else if (frequency === 'yearly') date.setFullYear(date.getFullYear() + 1);
    else date.setMonth(date.getMonth() + 1);
  }

  return todayIsoDate(date);
}

export function getFixedGoalContributionAmount(goal) {
  const target = Math.max(0, Number(goal?.target_amount || 0));
  const starting = Math.max(0, Number(goal?.starting_amount || 0));
  const count = Math.max(0, Math.floor(Number(goal?.duration_count || 0)));
  if (!count) return 0;
  return Math.max(0, target - starting) / count;
}

export function getFixedGoalNextDueDate(goal, postedOccurrenceCount = 0) {
  const firstDue = goal?.start_date || goal?.next_due_date;
  if (!firstDue) return null;
  return addGoalOccurrence(firstDue, goal?.frequency || 'monthly', postedOccurrenceCount);
}

export function getGoalOccurrenceStatus(goal, referenceDate = todayIsoDate()) {
  const dueDate = goal?.next_due_date;
  if (!dueDate) return { key: 'upcoming', label: 'No contribution date', daysUntilDue: null };
  const due = new Date(`${dueDate}T00:00:00`);
  const ref = new Date(`${referenceDate}T00:00:00`);
  const days = Math.round((due.getTime() - ref.getTime()) / 86400000);
  if (days < 0) return { key: 'overdue', label: `Overdue by ${Math.abs(days)}d`, daysUntilDue: days };
  if (days === 0) return { key: 'due_today', label: 'Due today', daysUntilDue: 0 };
  return { key: 'upcoming', label: `Due in ${days}d`, daysUntilDue: days };
}

export function getMonthKey(value) {
  return value ? String(value).slice(0, 7) : '';
}

export function getCurrentMonthKey() {
  return todayIsoDate().slice(0, 7);
}

export function isGoalActiveForMonth(goal, month) {
  if (!month) return true;

  const startMonth = getMonthKey(getGoalStartDate(goal));

  return !startMonth || startMonth <= month;
}

export function isGoalPlannedForMonth(goal, month) {
  if (!isGoalActiveForMonth(goal, month)) return false;

  const targetMonth = getMonthKey(goal?.target_date);

  return !targetMonth || month <= targetMonth;
}

export function getMonthsBetweenGoalDates(startDate, targetDate) {
  if (!startDate || !targetDate) return null;

  const start = new Date(`${String(startDate).slice(0, 10)}T00:00:00`);
  const target = new Date(`${String(targetDate).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(target.getTime())) return null;

  const yearDiff = target.getFullYear() - start.getFullYear();
  const monthDiff = target.getMonth() - start.getMonth();
  const totalMonths = yearDiff * 12 + monthDiff + 1;

  return Math.max(1, totalMonths);
}

export function getGoalOriginalFundingAmount(goal) {
  const target = Math.max(0, Number(goal?.target_amount || 0));
  const starting = Math.max(0, Number(goal?.starting_amount || 0));

  return Math.max(0, target - starting);
}

export function getGoalScheduledMonthlySaving(goal) {
  const amountToFund = getGoalOriginalFundingAmount(goal);

  if (amountToFund <= 0) return 0;

  const months = getMonthsBetweenGoalDates(getGoalStartDate(goal), goal?.target_date);

  if (months === null) return null;

  return Math.ceil(amountToFund / months);
}

export function getMonthlyRequiredSavingForMonth(goal, month) {
  if (!isGoalActiveForMonth(goal, month)) return null;

  const remaining = getGoalRemaining(goal);

  if (remaining <= 0) return 0;

  if (!month) return getMonthlyRequiredSaving(goal);

  const monthStart = `${month}-01`;
  const months = getMonthsBetweenGoalDates(monthStart, goal?.target_date);

  if (months === null) return null;

  return Math.ceil(remaining / months);
}

export function getGoalPlannedAmountForMonth(goal, month) {
  if (!month || !isGoalPlannedForMonth(goal, month)) return null;

  const targetMonth = getMonthKey(goal?.target_date);

  if (targetMonth && month <= targetMonth) {
    return getGoalScheduledMonthlySaving(goal);
  }

  return getMonthlyRequiredSavingForMonth(goal, month);
}

export function formatGoalDate(value) {
  if (!value) return 'No deadline';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return 'No deadline';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getGoalFundedAmount(goal) {
  const fallbackCurrent = Math.max(0, Number(goal?.current_amount || 0));
  const fundedAmount =
    goal?.funded_amount ??
    goal?.total_contributed_amount ??
    goal?.progress_amount ??
    fallbackCurrent;

  return Math.max(0, Number(fundedAmount || 0));
}

export function getGoalAvailableAmount(goal) {
  return Math.max(0, Number(goal?.current_amount || 0));
}

export function getGoalTransactionGoalId(transaction) {
  return transaction?.savings_goal_id || transaction?.goal_id || null;
}

export function isGoalFundUseTransaction(transaction) {
  const note = String(transaction?.note || '').trim().toLowerCase();

  return (
    transaction?.source_type === 'goal_withdrawal' ||
    (note.startsWith('use ') && note.endsWith(' funds'))
  );
}

export function getGoalFundingTotals(transactions = []) {
  return transactions.reduce(
    (totals, transaction) => {
      const goalId = getGoalTransactionGoalId(transaction);

      if (!goalId || transaction?.type !== 'transfer') return totals;

      const amount = Math.max(0, Number(transaction?.amount || 0));
      const isFundUse = isGoalFundUseTransaction(transaction);

      if (!isFundUse) {
        totals.fundedByGoal[goalId] = (totals.fundedByGoal[goalId] || 0) + amount;
      }

      totals.netByGoal[goalId] =
        (totals.netByGoal[goalId] || 0) + (isFundUse ? -amount : amount);

      return totals;
    },
    { fundedByGoal: {}, netByGoal: {} }
  );
}

export function attachGoalFundingProgress(goals = [], transactions = []) {
  const { fundedByGoal, netByGoal } = getGoalFundingTotals(transactions);

  return goals.map((goal) => {
    const netPostedTotal = Number(netByGoal[goal.id] || 0);
    const fundedPostedTotal = Number(fundedByGoal[goal.id] || 0);
    const startingAmount = Math.max(
      0,
      Number(goal.starting_amount ?? (Number(goal.current_amount || 0) - netPostedTotal))
    );

    return {
      ...goal,
      starting_amount: startingAmount,
      current_amount: Math.max(0, startingAmount + netPostedTotal),
      funded_amount: Math.max(0, startingAmount + fundedPostedTotal),
    };
  });
}

export function getGoalProgress(goal) {
  const funded = getGoalFundedAmount(goal);
  const target = Math.max(0, Number(goal?.target_amount || 0));

  if (!target) return 0;

  return Math.min(100, Math.round((funded / target) * 100));
}

export function getGoalRemaining(goal) {
  const funded = getGoalFundedAmount(goal);
  const target = Math.max(0, Number(goal?.target_amount || 0));

  return Math.max(0, target - funded);
}

export function getMonthsUntilTarget(targetDate) {
  if (!targetDate) return null;

  const today = new Date();
  const target = new Date(`${targetDate}T00:00:00`);

  if (Number.isNaN(target.getTime())) return null;

  const diffMs = target.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 0) return 0;

  return Math.max(1, Math.ceil(diffDays / 30.44));
}

export function getMonthlyRequiredSaving(goal) {
  const remaining = getGoalRemaining(goal);

  if (remaining <= 0) return 0;

  const months = getMonthsUntilTarget(goal?.target_date);

  if (months === null) return null;

  if (months <= 0) return remaining;

  return Math.ceil(remaining / months);
}

export function getGoalStatus(goal) {
  const progress = getGoalProgress(goal);
  const remaining = getGoalRemaining(goal);
  const months = getMonthsUntilTarget(goal?.target_date);

  if (remaining <= 0 || progress >= 100) {
    return {
      key: 'complete',
      label: 'Funded',
      className:
        'border-[hsl(var(--success)/0.2)] bg-[hsl(var(--success)/0.08)] text-[hsl(var(--success))]',
    };
  }

  if (months === 0) {
    return {
      key: 'due',
      label: 'Deadline reached',
      className: 'border-destructive/20 bg-destructive/10 text-destructive',
    };
  }

  if (months !== null && months <= 2) {
    return {
      key: 'urgent',
      label: `${months} mo left`,
      className:
        'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    };
  }

  return {
    key: 'active',
    label: months ? `${months} mo left` : 'Active',
    className: 'border-primary/20 bg-primary/10 text-primary',
  };
}

export function sortGoalsByPriority(goals = []) {
  return [...goals].sort((a, b) => {
    const aComplete = getGoalRemaining(a) <= 0;
    const bComplete = getGoalRemaining(b) <= 0;

    if (aComplete !== bComplete) return aComplete ? 1 : -1;

    const aDate = a.target_date || '9999-12-31';
    const bDate = b.target_date || '9999-12-31';

    if (aDate !== bDate) return aDate.localeCompare(bDate);

    return getGoalProgress(b) - getGoalProgress(a);
  });
}

export function getDefaultSavingsCategory(categories = []) {
  const normalize = (value) => String(value || '').toLowerCase().trim();

  return (
    categories.find(
      (category) =>
        normalize(category.type) === 'savings' && !category.parent_id
    ) ||
    categories.find((category) => normalize(category.type) === 'savings') ||
    null
  );
}
export function getDefaultDebtCategory(categories = []) {
  const normalize = (value) => String(value || '').toLowerCase().trim();

  return (
    categories.find(
      (category) => normalize(category.type) === 'debt' && !category.parent_id
    ) ||
    categories.find((category) => normalize(category.type) === 'debt') ||
    null
  );
}
