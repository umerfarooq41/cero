import test from 'node:test';
import assert from 'node:assert/strict';
import { getTransactionDeltas } from '../src/lib/transactionEffects.js';

const accounts = [
  { id: 'cash', category: 'asset' },
  { id: 'savings', category: 'asset' },
  { id: 'card', category: 'liability' },
];

test('income increases an asset account and reduces a liability balance', () => {
  assert.deepEqual(getTransactionDeltas({ type: 'income', amount: 100, account_id: 'cash' }, accounts), { cash: 100 });
  assert.deepEqual(getTransactionDeltas({ type: 'income', amount: 100, account_id: 'card' }, accounts), { card: -100 });
});

test('expense decreases an asset and increases a liability balance', () => {
  assert.deepEqual(getTransactionDeltas({ type: 'expense', amount: 25, account_id: 'cash' }, accounts), { cash: -25 });
  assert.deepEqual(getTransactionDeltas({ type: 'expense', amount: 25, account_id: 'card' }, accounts), { card: 25 });
});

test('transfer debits source and credits asset destination', () => {
  assert.deepEqual(getTransactionDeltas({
    type: 'transfer', amount: 40, account_id: 'cash', to_account_id: 'savings',
  }, accounts), { cash: -40, savings: 40 });
});

test('transfer to a liability reduces the liability balance', () => {
  assert.deepEqual(getTransactionDeltas({
    type: 'transfer', amount: 40, account_id: 'cash', to_account_id: 'card',
  }, accounts), { cash: -40, card: -40 });
});

test('missing accounts and zero amounts do not create balance deltas', () => {
  assert.deepEqual(getTransactionDeltas({ type: 'expense', amount: 0, account_id: 'unknown' }, accounts), {});
});
