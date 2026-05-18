/**
 * useSpendingVelocity
 * Calculates how fast you're burning through your monthly budget.
 * Returns velocity %, time progress %, projection, and a status signal.
 */
import { useMemo } from 'react';

export function useSpendingVelocity({ totalExpenses = 0, plannedExpenses = 0, currentMonth }) {
  return useMemo(() => {
    const now = new Date();
    const parts = (currentMonth || '').split('-').map(Number);
    const year = parts[0] || now.getFullYear();
    const month = parts[1] || now.getMonth() + 1;

    const daysInMonth = new Date(year, month, 0).getDate();
    const daysIntoMonth = Math.max(1, now.getDate());
    const progressPercent = Math.round((daysIntoMonth / daysInMonth) * 100);

    const dailyAverage = totalExpenses / daysIntoMonth;
    const projectedTotal = dailyAverage * daysInMonth;
    const velocityPercent =
      plannedExpenses > 0 ? Math.round((totalExpenses / plannedExpenses) * 100) : 0;

    let status = 'on-track';
    if (velocityPercent > progressPercent + 12) status = 'behind';
    else if (velocityPercent < progressPercent - 15) status = 'ahead';

    return {
      velocityPercent,
      progressPercent,
      daysIntoMonth,
      daysInMonth,
      projectedTotal,
      dailyAverage,
      status,
    };
  }, [totalExpenses, plannedExpenses, currentMonth]);
}
