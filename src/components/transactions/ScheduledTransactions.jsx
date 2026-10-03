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
  const currency = useCurrency();
  const currentMonth = getCurrentMonthKey();
  const { data: recurringTransactions = [] } = useRecurringTransactions();
  const { data: savingsGoals = [] } = useSavingsGoals();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: monthTransactions = [] } = useTransactions(currentMonth);
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: allocations = [] } = useAllocations(currentMonth);

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

  return (
    <div className="animate-child space-y-7">
      <ScheduledRecurringList
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

      <ScheduledGoalsList
        activeGoals={goals.activeGoals}
        accounts={accounts}
        currency={currency}
        savingGoalId={goals.savingGoalId}
        contributionDialog={goals.contributionDialog}
        formatCurrencyElement={formatCurrencyElement}
      />
    </div>
  );
}
