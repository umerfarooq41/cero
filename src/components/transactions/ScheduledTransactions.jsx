import { useState } from "react";
import {
  useAccounts,
  useAllocations,
  useAllTransactions,
  useCategories,
  useRecurringTransactions,
  useSavingsGoals,
  useTransactions,
} from "@/hooks/useBudgetData";
import { useCurrency } from "@/hooks/useCurrency";
import {
  getCurrencyCode as getSharedCurrencyCode,
  getCurrencySymbol as getSharedCurrencySymbol,
  formatCurrencyNumberText,
} from "@/lib/currencies";
import { cn } from "@/lib/utils";
import ScheduledRecurringList from "./ScheduledRecurringList";
import ScheduledGoalsList from "./ScheduledGoalsList";
import useRecurringItems from "./useRecurringItems";
import useGoalItems from "./useGoalItems";
import { getCurrentMonthKey } from "./scheduledUtils";

const getCurrencyCode = (currency) => getSharedCurrencyCode(currency);
const getCurrencySymbol = (currency) => getSharedCurrencySymbol(currency);

function formatNumber(value = 0) {
  const number = Number(value || 0);

  return formatCurrencyNumberText(number);
}

function CurrencyAmount({ amount, currency, className = "" }) {
  const code = getCurrencyCode(currency);
  const symbol = getCurrencySymbol(currency);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 align-middle whitespace-nowrap leading-none text-current tabular-nums",
        className,
      )}
    >
      {code === "SAR" ? (
        <span
          className="inline-block h-[0.8em] w-[0.8em] shrink-0 bg-current align-middle"
          style={{
            WebkitMask: "url(/sar.svg) center / contain no-repeat",
            mask: "url(/sar.svg) center / contain no-repeat",
          }}
        />
      ) : (
        <span className="text-current">{symbol}</span>
      )}

      <span className="tabular-nums">{formatNumber(amount)}</span>
    </span>
  );
}

function formatCurrencyElement(amount, currency, className = "") {
  return (
    <CurrencyAmount amount={amount} currency={currency} className={className} />
  );
}

export default function ScheduledTransactions() {
  const [section,setSection] = useState("income");
  const currency = useCurrency();
  const currentMonth = getCurrentMonthKey();
  const recurringTransactionsQuery = useRecurringTransactions();
  const recurringTransactions = recurringTransactionsQuery.data || [];
  const savingsGoalsQuery = useSavingsGoals();
  const savingsGoals = savingsGoalsQuery.data || [];
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data || [];
  const accountsQuery = useAccounts();
  const accounts = accountsQuery.data || [];
  const monthTransactionsQuery = useTransactions(currentMonth);
  const monthTransactions = monthTransactionsQuery.data || [];
  const allTransactionsQuery = useAllTransactions();
  const allTransactions = allTransactionsQuery.data || [];
  const allocationsQuery = useAllocations(currentMonth);
  const allocations = allocationsQuery.data || [];

  const recurring = useRecurringItems({
    recurringTransactions,
    accounts,
    allocations,
    monthTransactions,
    allTransactions,
  });

  const goals = useGoalItems({
    savingsGoals,
    allocations,
    currentMonth,
    monthTransactions,
    allTransactions,
    accounts,
    categories,
  });

  const queries = [recurringTransactionsQuery, savingsGoalsQuery, categoriesQuery, accountsQuery, monthTransactionsQuery, allTransactionsQuery, allocationsQuery];
  if (queries.some(query => query.isError && query.data === undefined)) return <div role="alert" className="space-y-3 py-8 text-center"><p>Couldn't load scheduled transactions.</p><button type="button" className="text-primary" onClick={() => queries.filter(query => query.isError).forEach(query => query.refetch())}>Retry</button></div>;
  if (queries.some(query => query.isPending)) return <p role="status" className="py-8 text-center text-sm text-muted-foreground">Loading scheduled transactions…</p>;

  return (
    <div className="animate-child space-y-7 lg:space-y-4">
      {<nav aria-label="Scheduled sections" className="cero-workplace-tabs flex items-center gap-2 overflow-x-auto whitespace-nowrap md:gap-5 border-b border-border">{[["income","Income"],["expense","Expenses"],["transfer","Debt payments"],["goals","Savings goals"]].map(([key,label])=><button key={key} type="button" aria-pressed={section===key} onClick={()=>setSection(key)} className={cn("shrink-0 border-b-2 px-2 py-3 text-sm font-medium",section===key?"border-primary text-primary":"border-transparent text-muted-foreground")}>{label}</button>)}</nav>}
      {(section!=="goals")&&<>
      <ScheduledRecurringList
        desktopSection={section}
        activeRecurring={recurring.activeRecurring}
        recurringByType={recurring.recurringByType}
        categories={categories}
        accounts={accounts}
        currency={currency}
        postingId={recurring.postingId}
        paymentDialog={recurring.paymentDialog}
        onPost={recurring.postRecurring}
        formatCurrencyElement={formatCurrencyElement}
      />

      </>}
      {(section==="goals")&&<ScheduledGoalsList
        desktop={true}
        activeGoals={goals.activeGoals}
        accounts={accounts}
        currency={currency}
        savingGoalId={goals.savingGoalId}
        contributionDialog={goals.contributionDialog}
        formatCurrencyElement={formatCurrencyElement}
      />}
    </div>
  );
}
