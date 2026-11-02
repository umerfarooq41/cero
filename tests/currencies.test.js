import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCurrencyByCode,
  getCurrencyCode,
  getCurrencyName,
  getCurrencySymbol,
  formatCurrencyNumberText,
} from '../src/lib/currencies.js';

test('currency lookup supports string and currency object inputs', () => {
  assert.equal(getCurrencyCode('SAR'), 'SAR');
  assert.equal(getCurrencyCode({ code: 'PKR' }), 'PKR');
  assert.equal(getCurrencySymbol('SAR'), 'SAR');
  assert.equal(getCurrencySymbol('USD'), '$');
  assert.equal(getCurrencyName('AED'), 'UAE Dirham');
});

test('unknown currencies safely fall back to the default currency', () => {
  assert.equal(getCurrencyByCode('UNKNOWN').code, 'SAR');
});

test('currency number formatting honors decimal display options', () => {
  assert.equal(formatCurrencyNumberText(1234.5, { showDecimals: true }), '1,234.50');
  assert.equal(formatCurrencyNumberText(1234.5, { showDecimals: false }), '1,235');
});
