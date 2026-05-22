import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeftRight,
  CalendarDays,
  Repeat,
  Search,
  Target,
  WalletCards,
  X,
} from 'lucide-react';

import EmptyState from '@/components/shared/EmptyState';
import FloatingActionButton from '@/components/shared/FloatingActionButton';
import MonthSelector from '@/components/shared/MonthSelector';
import TransactionTypeTabs from '@/components/shared/TransactionTypeTabs';
import TransactionRow from '@/components/transactions/TransactionRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAccounts,
  useCategories,
  useTransactions,
} from '@/hooks/useBudgetData';
import { useCurrency } from '@/hooks/useCurrency';
import {
  getCurrencyCode as getSharedCurrencyCode,
  getCurrencySymbol as getSharedCurrencySymbol,
} from '@/lib/currencies';
import { cn } from '@/lib/utils';

const ADD_TRANSACTION_ROUTE = '/add-transaction';

const getCurrencyCode = (currency) => getSharedCurrencyCode(currency);
const getCurrencySymbol = (currency) => getSharedCurrencySymbol(currency);

function formatNumber(value = 0) {
  const number = Number(value || 0);

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function CurrencyAmount({ amount, currency, compact = false, className = '' }) {
  const code = getCurrencyCode(currency);
  const symbol = getCurrencySymbol(currency);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 align-middle whitespace-nowrap leading-none text-current tabular-nums',
        className
      )}
    >
      {code === 'SAR' ? (
        <span
          className={cn(
            'inline-block shrink-0 bg-current align-middle',
            compact ? 'h-[0.8em] w-[0.8em]' : 'h-[0.9em] w-[0.9em]'
          )}
          style={{
            WebkitMask: 'url(/sar.svg) center / contain no-repeat',
            mask: 'url(/sar.svg) center / contain no-repeat',
          }}
        />
      ) : (
        <span className="text-current">{symbol}</span>
      )}

      <span className="tabular-nums">{formatNumber(amount)}</span>
    </span>
  );
}

function isRecurringTransaction(transaction) {
  return Boolean(
    transaction?.source_type === 'recurring' ||
      transaction?.recurring_transaction_id ||
      transaction?.recurring_posted_for_date
  );
}

function isGoalContribution(transaction) {
  return Boolean(
    transaction?.source_type === 'goal' ||
      transaction?.source_type === 'savings_goal' ||
      transaction?.savings_goal_id ||
      transaction?.goal_contribution_id
  );
}

const sourceFilters = [
  { value: 'all', label: 'All', icon: WalletCards },
  { value: 'regular', label: 'Regular', icon: ArrowLeftRight },
  { value: 'recurring', label: 'Recurring', icon: Repeat },
  { value: 'goal', label: 'Goals', icon: Target },
];

function SourceFilterTabs({ value, onChange, counts }) {
  return (
    <div className="grid w-full grid-cols-4 gap-1 rounded-2xl border border-white/40 bg-white/35 p-1.5 backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.03]">
      {sourceFilters.map((option) => {
        const active = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-semibold leading-none transition-all duration-200 sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm',
              active
                ? 'border border-border/60 bg-card/85 text-foreground shadow-sm backdrop-blur-xl'
                : 'text-muted-foreground hover:bg-background/45 hover:text-foreground'
            )}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="min-w-0 truncate">{option.label}</span>
            </span>

            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none sm:text-[10px]',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {counts[option.value] || 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function TransactionHistory() {
  const navigate = useNavigate();
  const currency = useCurrency();

  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const { data: transactions = [] } = useTransactions(currentMonth);
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const formatCurrency = (amount) => (
    <CurrencyAmount amount={amount} currency={currency} compact />
  );

  const sourceCounts = transactions.reduce(
    (counts, transaction) => {
      const recurring = isRecurringTransaction(transaction);
      const goal = isGoalContribution(transaction);

      counts.all += 1;

      if (recurring) counts.recurring += 1;
      if (goal) counts.goal += 1;
      if (!recurring && !goal) counts.regular += 1;

      return counts;
    },
    { all: 0, regular: 0, recurring: 0, goal: 0 }
  );

  const filtered = transactions.filter((transaction) => {
    const category = categories.find((c) => c.id === transaction.category_id);
    const fromAccount = accounts.find((a) => a.id === transaction.account_id);
    const toAccount = accounts.find((a) => a.id === transaction.to_account_id);

    const recurring = isRecurringTransaction(transaction);
    const goal = isGoalContribution(transaction);
    const searchValue = search.trim().toLowerCase();

    const sourceLabels = [
      recurring ? 'recurring' : '',
      goal ? 'goal contribution goal savings' : '',
      !recurring && !goal ? 'regular' : '',
    ];

    const matchSearch =
      !searchValue ||
      category?.name?.toLowerCase().includes(searchValue) ||
      transaction.note?.toLowerCase().includes(searchValue) ||
      fromAccount?.name?.toLowerCase().includes(searchValue) ||
      toAccount?.name?.toLowerCase().includes(searchValue) ||
      sourceLabels.some((label) => label.includes(searchValue));

    const matchType = filterType === 'all' || transaction.type === filterType;
    const matchDate = !selectedDate || transaction.date === selectedDate;
    const matchSource =
      sourceFilter === 'all' ||
      (sourceFilter === 'regular' && !recurring && !goal) ||
      (sourceFilter === 'recurring' && recurring) ||
      (sourceFilter === 'goal' && goal);

    return matchSearch && matchType && matchDate && matchSource;
  });

  const grouped = filtered.reduce((groups, transaction) => {
    const transactionDate = transaction.date || 'No Date';

    if (!groups[transactionDate]) groups[transactionDate] = [];

    groups[transactionDate].push(transaction);

    return groups;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const hasTransactions = sortedDates.length > 0;

  const handleMonthChange = (nextMonth) => {
    setCurrentMonth(nextMonth);
    setSelectedDate('');
  };

  const openDatePicker = () => {
    const picker = document.getElementById('transaction-date-picker');

    if (picker?.showPicker) {
      picker.showPicker();
    } else {
      picker?.click();
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-center animate-child">
        <MonthSelector
          currentMonth={currentMonth}
          onChange={handleMonthChange}
          subtitle={
            selectedDate
              ? format(new Date(selectedDate), 'MMM d, yyyy')
              : `${filtered.length} posted transactions`
          }
          onLabelClick={openDatePicker}
          trailingAction={
            <>
              <label className="relative h-9 w-9 shrink-0 cursor-pointer">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80">
                  <CalendarDays className="h-4 w-4" />
                </span>

                <Input
                  id="transaction-date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => {
                    const date = event.target.value;
                    setSelectedDate(date);

                    if (date) {
                      setCurrentMonth(format(new Date(date), 'yyyy-MM'));
                    }
                  }}
                  className="absolute inset-0 h-9 w-9 cursor-pointer opacity-0"
                />
              </label>

              {selectedDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground"
                  onClick={() => setSelectedDate('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </>
          }
        />
      </div>

      <div className="mb-4 flex gap-2 animate-child">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search transactions, accounts, recurring, goals..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 pl-9"
          />
        </div>
      </div>

      <TransactionTypeTabs
        value={filterType}
        onChange={setFilterType}
        className="mb-3 animate-child"
      />

      <div className="mb-6 animate-child">
        <SourceFilterTabs
          value={sourceFilter}
          onChange={setSourceFilter}
          counts={sourceCounts}
        />
      </div>

      {!hasTransactions ? (
        <div className="animate-child">
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions found"
            description="Try changing the month, date, search, type, or source filter."
            actionLabel="Add Transaction"
            onAction={() => navigate(ADD_TRANSACTION_ROUTE)}
          />
        </div>
      ) : (
        <div className="animate-child space-y-4">
          {sortedDates.map((date) => (
            <div
              key={date}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-xl"
            >
              <div className="border-b border-border/50 bg-card/50 px-4 py-2.5 backdrop-blur-xl">
                <span className="text-xs font-semibold text-muted-foreground">
                  {date !== 'No Date'
                    ? format(new Date(date), 'EEEE, MMM d')
                    : 'No Date'}
                </span>
              </div>

              <div className="divide-y divide-border/50">
                {grouped[date].map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    category={categories.find(
                      (category) => category.id === transaction.category_id
                    )}
                    account={accounts.find(
                      (account) => account.id === transaction.account_id
                    )}
                    toAccount={accounts.find(
                      (account) => account.id === transaction.to_account_id
                    )}
                    formatCurrency={formatCurrency}
                    onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasTransactions && (
        <FloatingActionButton
          to={ADD_TRANSACTION_ROUTE}
          ariaLabel="Add transaction"
        />
      )}
    </div>
  );
}
