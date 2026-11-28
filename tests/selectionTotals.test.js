import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSelectionTotals } from '../src/lib/selectionTotals.js';

test('selection totals retain signed refunds and isolate adjustments', () => {
  assert.deepEqual(getSelectionTotals([{type:'expense',amount:100},{type:'expense',amount:-25},{type:'income',amount:50},{type:'transfer',amount:10},{type:'income',source_type:'adjustment',amount:20}]), {income:50,expense:75,transfer:10,adjustment:20});
});
test('selection totals handle cents and invalid values', () => {
  assert.deepEqual(getSelectionTotals([{type:'expense',amount:0.1},{type:'expense',amount:0.2},{type:'expense',amount:'invalid'}]), {income:0,expense:0.3,transfer:0,adjustment:0});
});

test('legacy balance adjustments do not inflate income or expenses', () => {
  assert.deepEqual(getSelectionTotals([{type:'income',amount:30,note:'Account balance adjustment'},{type:'expense',amount:20,note:'Debt principal removed: example'}]), {income:0,expense:0,transfer:0,adjustment:50});
});
