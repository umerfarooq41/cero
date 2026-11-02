import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDueDateAfterOccurrences,
  calculateNextDueDate,
  getRecurringStatus,
  getUpcomingRecurringRules,
} from '../src/lib/recurringTransactions.js';

test('recurring schedules calculate next dates for supported frequencies', () => {
  assert.equal(calculateNextDueDate('2026-01-31', 'monthly'), '2026-02-28');
  assert.equal(calculateNextDueDate('2026-01-01', 'weekly'), '2026-01-08');
  assert.equal(calculateNextDueDate('2026-01-01', 'biweekly'), '2026-01-15');
  assert.equal(calculateNextDueDate('2026-01-01', 'quarterly'), '2026-04-01');
  assert.equal(calculateNextDueDate('2026-01-01', 'yearly'), '2027-01-01');
});

test('recurring schedule advances by multiple occurrences', () => {
  assert.equal(calculateDueDateAfterOccurrences('2026-01-31', 'monthly', 2), '2026-03-28');
});

test('recurring status identifies paused, overdue, due-today and upcoming rules', () => {
  assert.equal(getRecurringStatus({ is_active: false, next_due_date: '2026-11-02' }, '2026-11-02').key, 'paused');
  assert.equal(getRecurringStatus({ is_active: true, next_due_date: '2026-11-01' }, '2026-11-02').key, 'overdue');
  assert.equal(getRecurringStatus({ is_active: true, next_due_date: '2026-11-02' }, '2026-11-02').key, 'due_today');
  assert.equal(getRecurringStatus({ is_active: true, next_due_date: '2026-11-05' }, '2026-11-02').daysUntilDue, 3);
});

test('upcoming rules exclude paused items and honor the requested limit', () => {
  const rules = [
    { id: 'later', is_active: true, next_due_date: '2026-11-10' },
    { id: 'paused', is_active: false, next_due_date: '2026-11-01' },
    { id: 'soon', is_active: true, next_due_date: '2026-11-03' },
  ];
  assert.deepEqual(getUpcomingRecurringRules(rules, 1).map((rule) => rule.id), ['soon']);
});
