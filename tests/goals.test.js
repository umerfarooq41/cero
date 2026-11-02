import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addGoalOccurrence,
  attachGoalFundingProgress,
  getFixedGoalContributionAmount,
  getFixedGoalTargetDate,
  getGoalFundingTotals,
  getGoalOccurrenceStatus,
  getGoalProgress,
  getGoalRemaining,
  isGoalPlannedForMonth,
} from '../src/lib/goals.js';

test('goal occurrences support weekly, biweekly and clamped calendar months', () => {
  assert.equal(addGoalOccurrence('2026-01-31', 'monthly', 1), '2026-02-28');
  assert.equal(addGoalOccurrence('2026-01-31', 'monthly', 2), '2026-03-28');
  assert.equal(addGoalOccurrence('2026-01-01', 'weekly', 2), '2026-01-15');
  assert.equal(addGoalOccurrence('2026-01-01', 'biweekly', 1), '2026-01-15');
});

test('fixed goal target date counts the first occurrence as period one', () => {
  assert.equal(getFixedGoalTargetDate('2026-01-31', 3, 'monthly'), '2026-03-28');
  assert.equal(getFixedGoalTargetDate('2026-01-01', 0, 'monthly'), '');
});

test('fixed contributions are rounded and capped by remaining target', () => {
  assert.equal(getFixedGoalContributionAmount({
    target_amount: 100, starting_amount: 0, current_amount: 0, duration_count: 3,
  }), 34);
  assert.equal(getFixedGoalContributionAmount({
    target_amount: 100, starting_amount: 0, current_amount: 68, duration_count: 3, posted_occurrence_count: 2,
  }), 32);
  assert.equal(getFixedGoalContributionAmount({
    target_amount: 100, starting_amount: 0, current_amount: 100, duration_count: 3,
  }), 0);
});

test('goal status distinguishes overdue, due today and upcoming', () => {
  assert.equal(getGoalOccurrenceStatus({ next_due_date: '2026-11-01' }, '2026-11-02').key, 'overdue');
  assert.equal(getGoalOccurrenceStatus({ next_due_date: '2026-11-02' }, '2026-11-02').key, 'due_today');
  assert.equal(getGoalOccurrenceStatus({ next_due_date: '2026-11-05' }, '2026-11-02').daysUntilDue, 3);
});

test('goal funding separates lifetime contributions from available balance', () => {
  const transactions = [
    { savings_goal_id: 'g1', type: 'transfer', amount: 50 },
    { savings_goal_id: 'g1', type: 'transfer', amount: 10, source_type: 'goal_withdrawal' },
    { savings_goal_id: 'g1', type: 'expense', amount: 500 },
  ];
  const totals = getGoalFundingTotals(transactions);
  assert.equal(totals.fundedByGoal.g1, 50);
  assert.equal(totals.netByGoal.g1, 40);
  const [goal] = attachGoalFundingProgress([{ id: 'g1', target_amount: 100, starting_amount: 20 }], transactions);
  assert.equal(goal.funded_amount, 70);
  assert.equal(goal.current_amount, 60);
});

test('goal progress is bounded and remaining amount cannot be negative', () => {
  assert.equal(getGoalProgress({ target_amount: 100, funded_amount: 125 }), 100);
  assert.equal(getGoalRemaining({ target_amount: 100, funded_amount: 125 }), 0);
  assert.equal(getGoalProgress({ target_amount: 0, funded_amount: 20 }), 0);
});

test('goal planning respects its start and target months', () => {
  const goal = { start_date: '2026-03-15', target_date: '2026-08-01' };
  assert.equal(isGoalPlannedForMonth(goal, '2026-02'), false);
  assert.equal(isGoalPlannedForMonth(goal, '2026-05'), true);
  assert.equal(isGoalPlannedForMonth(goal, '2026-09'), false);
});
