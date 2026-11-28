export function getSelectionTotals(rows = []) {
  const totals = { income: 0, expense: 0, transfer: 0, adjustment: 0 };
  for (const row of rows) {
    const amount = Number(row.amount);
    if (!Number.isFinite(amount)) continue;
    const type = (row.source_type === 'adjustment' || /^(Account balance adjustment|Debt principal removed:)/i.test(row.note || '')) ? 'adjustment' : row.type;
    if (Object.hasOwn(totals, type)) totals[type] += Math.round(amount * 100);
  }
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / 100]));
}
