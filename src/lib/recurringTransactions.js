import { addMonths, addWeeks, addYears, differenceInCalendarDays, format, parseISO } from 'date-fns';

export const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export function todayIsoDate() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatRecurringDate(value) {
  if (!value) return 'No date';

  try {
    return format(parseISO(value), 'MMM d, yyyy');
  } catch {
    return String(value);
  }
}

export function getRecurringFrequencyLabel(value) {
  return FREQUENCY_OPTIONS.find((option) => option.value === value)?.label || 'Monthly';
}

export function getRecurringStatus(rule, referenceDate = todayIsoDate()) {
  if (!rule?.is_active) {
    return {
      key: 'paused',
      label: 'Paused',
      tone: 'muted',
      daysUntilDue: null,
    };
  }

  if (!rule?.next_due_date) {
    return {
      key: 'upcoming',
      label: 'Upcoming',
      tone: 'info',
      daysUntilDue: null,
    };
  }

  const daysUntilDue = differenceInCalendarDays(
    parseISO(rule.next_due_date),
    parseISO(referenceDate)
  );

  if (daysUntilDue < 0) {
    return {
      key: 'overdue',
      label: `Overdue by ${Math.abs(daysUntilDue)}d`,
      tone: 'danger',
      daysUntilDue,
    };
  }

  if (daysUntilDue === 0) {
    return {
      key: 'due_today',
      label: 'Due today',
      tone: 'warning',
      daysUntilDue,
    };
  }

  return {
    key: 'upcoming',
    label: `Due in ${daysUntilDue}d`,
    tone: 'info',
    daysUntilDue,
  };
}

export function calculateNextDueDate(currentDueDate, frequency = 'monthly') {
  const baseDate = currentDueDate ? parseISO(currentDueDate) : new Date();

  const nextDate =
    frequency === 'weekly'
      ? addWeeks(baseDate, 1)
      : frequency === 'biweekly'
        ? addWeeks(baseDate, 2)
        : frequency === 'quarterly'
          ? addMonths(baseDate, 3)
          : frequency === 'yearly'
            ? addYears(baseDate, 1)
            : addMonths(baseDate, 1);

  return format(nextDate, 'yyyy-MM-dd');
}

export function calculateDueDateAfterOccurrences(startDate, frequency = 'monthly', occurrenceCount = 0) {
  let dueDate = startDate || todayIsoDate();
  const count = Math.max(0, Math.floor(Number(occurrenceCount || 0)));

  for (let index = 0; index < count; index += 1) {
    dueDate = calculateNextDueDate(dueDate, frequency);
  }

  return dueDate;
}

export function getFixedDebtNextDueDate(rule, postedOccurrenceCount = 0) {
  if (!rule || rule.payment_mode === 'flexible') return rule?.next_due_date || null;

  // next_due_date is the authoritative anchor for the remaining schedule.
  // This lets a user revise future installments after payments have started
  // without recalculating or rewriting historical occurrence dates.
  if (rule.next_due_date) return rule.next_due_date;

  const firstDueDate = rule.start_date;
  if (!firstDueDate) return null;

  return calculateDueDateAfterOccurrences(
    firstDueDate,
    rule.frequency || 'monthly',
    postedOccurrenceCount,
  );
}

export function sortRecurringByDueDate(rules = []) {
  return [...rules].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return String(a.next_due_date || '').localeCompare(String(b.next_due_date || ''));
  });
}

export function getUpcomingRecurringRules(rules = [], limit = 5) {
  return sortRecurringByDueDate(rules)
    .filter((rule) => rule.is_active)
    .slice(0, limit);
}
