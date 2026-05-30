export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
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

export function getGoalProgress(goal) {
  const current = Math.max(0, Number(goal?.current_amount || 0));
  const target = Math.max(0, Number(goal?.target_amount || 0));

  if (!target) return 0;

  return Math.min(100, Math.round((current / target) * 100));
}

export function getGoalRemaining(goal) {
  const current = Math.max(0, Number(goal?.current_amount || 0));
  const target = Math.max(0, Number(goal?.target_amount || 0));

  return Math.max(0, target - current);
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
