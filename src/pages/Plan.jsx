import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { PencilLine } from 'lucide-react';

import { Button } from '@/components/ui/button';
import PageHeader from '@/components/layout/PageHeader';
import MonthSelector from '@/components/shared/MonthSelector';
import LeftToAllocateBanner from '@/components/plan/LeftToAllocateBanner';
import PlanOverview from '@/components/plan/PlanOverview';
import {
  useAllocations,
  useBudgetSummary,
  useCategories,
  useTransactions,
} from '@/hooks/useBudgetData';
import { useCurrency, useCurrencyFormatter } from '@/hooks/useCurrency';
import { usePageEntrance } from '@/hooks/usePageTransition';
import { getCurrencyNoun as getCurrencyName } from '@/lib/currencies';
import { buildPlanTotals } from '@/lib/planData';

export default function Plan() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const monthFromUrl = searchParams.get('month');

  const [currentMonth, setCurrentMonth] = useState(
    monthFromUrl || format(new Date(), 'yyyy-MM')
  );
  const [activeTab, setActiveTab] = useState('expense');

  const currency = useCurrency();
  const formatCurrency = useCurrencyFormatter();

  useBudgetSummary(currentMonth);
  const { data: categories = [] } = useCategories();
  const { data: allocations = [] } = useAllocations(currentMonth);
  const { data: transactions = [] } = useTransactions(currentMonth);

  const subcategories = useMemo(
    () => categories.filter((category) => category.parent_id),
    [categories]
  );

  const plannedTotals = useMemo(
    () => buildPlanTotals({ allocations, categories }),
    [allocations, categories]
  );

  const leftToAllocate =
    plannedTotals.income -
    plannedTotals.expense -
    plannedTotals.savings -
    plannedTotals.debt;

  const handleMonthChange = (month) => {
    setCurrentMonth(month);

    const params = new URLSearchParams(location.search);
    params.set('month', month);

    navigate(`/plan?${params.toString()}`, { replace: true });
  };

  return (
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        title="Plan"
        subtitle={`Give every ${getCurrencyName(currency)} a purpose`}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-28 md:px-6 lg:py-8">
        <div className="mb-4 animate-child">
          <div className="flex items-center justify-center">
            <MonthSelector
              currentMonth={currentMonth}
              onChange={handleMonthChange}
              subtitle="Budget period"
              trailingAction={
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl"
                  onClick={() =>
                    navigate(`/manage-plan?tab=monthly-plan&month=${currentMonth}`)
                  }
                  aria-label="Manage monthly plan"
                >
                  <PencilLine className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </div>

        <div className="animate-child space-y-4 pt-4">
          <LeftToAllocateBanner
            leftToAllocate={leftToAllocate}
            totalIncome={plannedTotals.income}
            isEditMode={false}
            formatCurrency={formatCurrency}
            sticky={false}
          />

          <PlanOverview
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            categories={categories}
            subcategories={subcategories}
            currency={currency}
            allocations={allocations}
            transactions={transactions}
          />
        </div>
      </main>
    </div>
  );
}
