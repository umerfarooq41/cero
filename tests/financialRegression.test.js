import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAutoSweepSurplus,
  filterTransactionsByBudgetMonth,
  getBudgetMonthCloseDate,
  hasAutoSweepForMonth,
} from '../src/lib/budgetLogic.js';
import {
  attachGoalFundingProgress,
  getFixedGoalContributionAmount,
  getGoalFundingTotals,
  getGoalProgress,
  getGoalRemaining,
} from '../src/lib/goals.js';
import {
  calculateDueDateAfterOccurrences,
  calculateNextDueDate,
  getFixedDebtNextDueDate,
  getUpcomingRecurringRules,
} from '../src/lib/recurringTransactions.js';
import { getTransactionDeltas } from '../src/lib/transactionEffects.js';

const accounts = [
  { id: 'checking', category: 'asset' },
  { id: 'savings', category: 'asset' },
  { id: 'credit', category: 'liability' },
];

function sumDeltas(transactions) {
  return transactions.reduce((total, transaction) => {
    for (const [id, delta] of Object.entries(getTransactionDeltas(transaction, accounts))) {
      total[id] = (total[id] || 0) + delta;
    }
    return total;
  }, {});
}

test('asset-to-liability payment and reversal restore both balances', () => {
  const payment = { type: 'transfer', amount: 75, account_id: 'checking', to_account_id: 'credit' };
  const reversal = { type: 'transfer', amount: 75, account_id: 'credit', to_account_id: 'checking' };
  assert.deepEqual(getTransactionDeltas(payment, accounts), { checking: -75, credit: -75 });
  assert.deepEqual(getTransactionDeltas(reversal, accounts), { credit: 75, checking: 75 });
  assert.deepEqual(sumDeltas([payment, reversal]), { checking: 0, credit: 0 });
});

test('credit-card expenses and refunds have opposite balance effects', () => {
  assert.deepEqual(sumDeltas([
    { type: 'expense', amount: 42.5, account_id: 'credit' },
    { type: 'income', amount: 42.5, account_id: 'credit' },
  ]), { credit: 0 });
  assert.deepEqual(getTransactionDeltas({
    type: 'transfer', amount: 25, account_id: 'credit', to_account_id: 'savings',
  }, accounts), { credit: 25, savings: 25 });
});

test('budget-month reporting assigns income separately from expense dates', () => {
  const rows = [
    { id: 'pay', type: 'income', date: '2026-10-31', budget_month: '2026-11' },
    { id: 'expense', type: 'expense', date: '2026-11-01', budget_month: '2026-10' },
    { id: 'old', type: 'expense', date: '2026-10-31' },
  ];
  assert.deepEqual(filterTransactionsByBudgetMonth(rows, '2026-11').map(row => row.id), ['pay', 'expense']);
  assert.deepEqual(filterTransactionsByBudgetMonth(rows, '2026-10').map(row => row.id), ['old']);
  assert.equal(getBudgetMonthCloseDate('2024-02'), '2024-02-29');
});

test('auto-sweep is bounded by available cash even when unused plan is larger', () => {
  const categories = [
    { id: 'living', type: 'expense' },
    { id: 'saving', type: 'savings' },
    { id: 'debt', type: 'debt' },
  ];
  const transactions = [
    { type: 'income', amount: 600 },
    { type: 'income', amount: 1000, source_type: 'adjustment' },
    { type: 'expense', category_id: 'living', amount: 200 },
    { type: 'transfer', category_id: 'saving', amount: 250 },
    { type: 'transfer', category_id: 'debt', amount: 50 },
  ];
  const allocations = [{ category_id: 'living', planned_amount: 500 }];
  assert.equal(calculateAutoSweepSurplus({ transactions, allocations, categories }), 100);
  assert.equal(calculateAutoSweepSurplus({ transactions, allocations: [], categories }), 0);
  assert.equal(hasAutoSweepForMonth([{ note: 'Close [AUTO_SWEEP:2026-11]' }], '2026-11'), true);
  assert.equal(hasAutoSweepForMonth([{ note: 'Close [AUTO_SWEEP:2026-11]' }], '2026-12'), false);
});

test('goal lifetime funding remains separate from money withdrawn for use', () => {
  const transactions = [
    { savings_goal_id: 'trip', type: 'transfer', amount: 200 },
    { savings_goal_id: 'trip', type: 'transfer', amount: 50, source_type: 'goal_withdrawal' },
    { goal_id: 'trip', type: 'transfer', amount: 10, note: 'Use Trip funds' },
    { savings_goal_id: 'other', type: 'transfer', amount: 25 },
    { savings_goal_id: 'trip', type: 'expense', amount: 100 },
  ];
  const totals = getGoalFundingTotals(transactions);
  assert.equal(totals.fundedByGoal.trip, 200);
  assert.equal(totals.netByGoal.trip, 140);
  assert.equal(totals.fundedByGoal.other, 25);
  const [trip] = attachGoalFundingProgress([
    { id: 'trip', target_amount: 300, starting_amount: 20 },
  ], transactions);
  assert.equal(trip.funded_amount, 220);
  assert.equal(trip.current_amount, 160);
  assert.equal(getGoalRemaining(trip), 80);
  assert.equal(getGoalProgress(trip), 73);
});

test('fixed goal installments cap the last contribution at the exact remainder', () => {
  const whole = { target_amount: 1000, starting_amount: 0, duration_count: 3 };
  assert.equal(getFixedGoalContributionAmount(whole), 334);
  assert.equal(getFixedGoalContributionAmount({
    ...whole, current_amount: 668, posted_occurrence_count: 2,
  }), 332);

  const cents = { target_amount: 1000.01, starting_amount: 0, duration_count: 3 };
  assert.equal(getFixedGoalContributionAmount(cents), 333.34);
  assert.ok(Math.abs(getFixedGoalContributionAmount({
    ...cents, current_amount: 666.68, posted_occurrence_count: 2,
  }) - 333.33) < 0.001);
  assert.equal(getFixedGoalContributionAmount({
    ...cents, current_amount: 1000.01, posted_occurrence_count: 3,
  }), 0);
});

test('recurring and fixed debt schedules respect month-end and stored due-date anchors', () => {
  assert.equal(calculateNextDueDate('2024-01-31', 'monthly'), '2024-02-29');
  assert.equal(calculateDueDateAfterOccurrences('2026-01-31', 'monthly', 2), '2026-03-28');
  assert.equal(getFixedDebtNextDueDate({
    payment_mode: 'fixed', start_date: '2026-01-01',
    next_due_date: '2026-12-15', frequency: 'monthly',
  }, 8), '2026-12-15');
  assert.deepEqual(getUpcomingRecurringRules([
    { id: 'paused', is_active: false, next_due_date: '2026-11-01' },
    { id: 'later', is_active: true, next_due_date: '2026-12-01' },
    { id: 'first', is_active: true, next_due_date: '2026-11-15' },
  ], 2).map(rule => rule.id), ['first', 'later']);
});
