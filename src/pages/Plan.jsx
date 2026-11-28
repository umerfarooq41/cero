import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';

import PageHeader from '@/components/layout/PageHeader';
import MonthlyPlanPanel from '@/components/manage-plan/MonthlyPlanPanel';
import {
  useAllTransactions,
  useGoalContributions,
  useTransactions,
} from '@/hooks/useBudgetData';
import { usePageEntrance } from '@/hooks/usePageTransition';
import { getTransactionBudgetMonth } from '@/lib/budgetLogic';

export default function Plan() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const monthFromUrl = searchParams.get('month');

  const [currentMonth, setCurrentMonth] = useState(
    monthFromUrl || format(new Date(), 'yyyy-MM')
  );
  const desktopDraft = useRef({});
  const [desktopSaving, setDesktopSaving] = useState(false);
  useEffect(() => {
    const warn = (event) => {
      if (!desktopSaving && !Object.keys(desktopDraft.current).length) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [desktopSaving]);

  const { data: transactions = [] } = useTransactions(currentMonth);
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: goalContributions = [] } = useGoalContributions();

  // Plan accounting follows the scheduled occurrence month for recurring
  // postings. Transaction History still follows the actual posting date.
  // This lets a late/early payment verify the month it was actually due for.
  const planTransactions = useMemo(() => {
    const byId = new Map();

    allTransactions.forEach((transaction) => {
      const occurrenceMonth = transaction?.recurring_posted_for_date
        ? String(transaction.recurring_posted_for_date).slice(0, 7)
        : null;
      const transactionMonth = String(
        transaction?.date ||
          transaction?.transaction_date ||
          transaction?.created_at ||
          ''
      ).slice(0, 7);
      const incomeBudgetMonth = transaction?.type === 'income'
        ? getTransactionBudgetMonth(transaction)
        : null;
      const effectiveMonth = incomeBudgetMonth || occurrenceMonth || transactionMonth;

      if (effectiveMonth === currentMonth) {
        byId.set(
          transaction.id ||
            `${effectiveMonth}:${transaction.type}:${transaction.amount}:${transaction.account_id || ''}`,
          transaction
        );
      }
    });

    // Keep the month-scoped query as a fallback while avoiding recurring rows
    // whose immutable occurrence belongs to a different Plan month.
    transactions.forEach((transaction) => {
      const occurrenceMonth = transaction?.recurring_posted_for_date
        ? String(transaction.recurring_posted_for_date).slice(0, 7)
        : null;
      const incomeBudgetMonth = transaction?.type === 'income'
        ? getTransactionBudgetMonth(transaction)
        : null;
      if (incomeBudgetMonth && incomeBudgetMonth !== currentMonth) return;
      if (!incomeBudgetMonth && occurrenceMonth && occurrenceMonth !== currentMonth) return;

      byId.set(
        transaction.id ||
          `${currentMonth}:${transaction.type}:${transaction.amount}:${transaction.account_id || ''}`,
        transaction
      );
    });

    return [...byId.values()];
  }, [allTransactions, currentMonth, transactions]);

  const handleMonthChange = (month) => {
    if (month === currentMonth || desktopSaving) return;
    if (Object.keys(desktopDraft.current).length && !window.confirm('Discard unsaved allocation changes?')) return;
    desktopDraft.current = {};
    setCurrentMonth(month);

    const params = new URLSearchParams(location.search);
    params.set('month', month);

    navigate(`/plan?${params.toString()}`, { replace: true });
  };

  return <div ref={scope} className="min-h-screen bg-transparent"><PageHeader title="Plan" /><main className="cero-page-content mx-auto w-full max-w-7xl px-4 pb-24 pt-3 md:px-5 md:pb-8 workspace:px-8"><MonthlyPlanPanel key={currentMonth} currentMonth={currentMonth} onMonthChange={handleMonthChange} unified draftRef={desktopDraft} sharedSaving={desktopSaving} onSavingChange={setDesktopSaving} transactions={planTransactions} goalContributions={goalContributions}/></main></div>;
}
