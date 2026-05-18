/**
 * useSavingsRate
 * Computes a clean savings rate percentage and rolling 6-month trend.
 * Used in Plan page hero card and Reflect page.
 */
import { useMemo } from 'react';

export function useSavingsRate({ income = 0, expenses = 0, trackedSavings = 0 }) {
  return useMemo(() => {
    if (income <= 0) return { rate: 0, label: '—', tier: 'neutral' };

    const netSaved = income - expenses;
    const rate = Math.round((netSaved / income) * 100);

    let tier = 'danger';
    if (rate >= 20) tier = 'excellent';
    else if (rate >= 10) tier = 'good';
    else if (rate >= 5) tier = 'fair';
    else if (rate >= 0) tier = 'low';

    const label =
      tier === 'excellent' ? 'Excellent' :
      tier === 'good'      ? 'Good'      :
      tier === 'fair'      ? 'Fair'      :
      tier === 'low'       ? 'Low'       : 'Deficit';

    return { rate, label, tier };
  }, [income, expenses, trackedSavings]);
}
