import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAutoSweepSurplus,
  calculateMonthSurplus,
  filterTransactionsByBudgetMonth,
  filterTransactionsByBudgetYear,
  getAutoSweepMarker,
  getBudgetMonth,
  getBudgetMonthCloseDate,
  getNextBudgetMonth,
  getPreviousBudgetMonth,
  getTransactionBudgetMonth,
  hasAutoSweepForMonth,
} from '../src/lib/budgetLogic.js';

test('budget month parsing handles valid dates and rejects invalid dates', () => {
  assert.equal(getBudgetMonth('2026-11-02'), '2026-11');
  assert.equal(getBudgetMonth('2024-02-29'), '2024-02');
  assert.equal(getBudgetMonth('2025-02-29'), null);
  assert.equal(getBudgetMonth('not-a-date'), null);
});

test('budget month navigation crosses year boundaries', () => {
  assert.equal(getNextBudgetMonth('2026-12'), '2027-01');
  assert.equal(getPreviousBudgetMonth('2026-01'), '2025-12');
  assert.equal(getNextBudgetMonth('2026-13'), null);
});

test('budget close date returns the final calendar day', () => {
  assert.equal(getBudgetMonthCloseDate('2024-02'), '2024-02-29');
  assert.equal(getBudgetMonthCloseDate('2025-02'), '2025-02-28');
  assert.equal(getBudgetMonthCloseDate('2026-11'), '2026-11-30');
});

test('income uses its assigned budget month while expenses use transaction date', () => {
  assert.equal(getTransactionBudgetMonth({ type: 'income', date: '2026-10-30', budget_month: '2026-11' }), '2026-11');
  assert.equal(getTransactionBudgetMonth({ type: 'expense', date: '2026-10-30', budget_month: '2026-11' }), '2026-10');
});

test('month and year filters respect assigned income budget month', () => {
  const rows = [
    { type: 'income', date: '2026-10-31', budget_month: '2026-11' },
    { type: 'expense', date: '2026-11-01' },
    { type: 'expense', date: '2025-11-01' },
  ];
  assert.equal(filterTransactionsByBudgetMonth(rows, '2026-11').length, 2);
  assert.equal(filterTransactionsByBudgetYear(rows, '2026').length, 2);
});

test('month surplus never becomes negative', () => {
  assert.equal(calculateMonthSurplus({ plannedExpenses: 1000, actualExpenses: 725 }), 275);
  assert.equal(calculateMonthSurplus({ plannedExpenses: 500, actualExpenses: 700 }), 0);
});

test('auto-sweep marker detects an existing sweep for the exact month', () => {
  const rows = [{ note: 'Monthly close ' + getAutoSweepMarker('2026-11') }];
  assert.equal(hasAutoSweepForMonth(rows, '2026-11'), true);
  assert.equal(hasAutoSweepForMonth(rows, '2026-10'), false);
});

test('auto-sweep is capped by both unused expense plan and available cash', () => {
  const categories = [
    { id: 'food', type: 'expense' },
    { id: 'save', type: 'savings' },
    { id: 'debt', type: 'debt' },
  ];
  const transactions = [
    { type: 'income', amount: 2000 },
    { type: 'expense', amount: 600, category_id: 'food' },
    { type: 'transfer', amount: 200, category_id: 'save' },
    { type: 'transfer', amount: 100, category_id: 'debt' },
    { type: 'income', amount: 500, source_type: 'adjustment' },
  ];
  const allocations = [{ category_id: 'food', planned_amount: 1000 }];
  assert.equal(calculateAutoSweepSurplus({ transactions, allocations, categories }), 400);
  assert.equal(calculateAutoSweepSurplus({ transactions, allocations: [], categories }), 0);
});
