import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  Repeat,
  Search,
  SlidersHorizontal,
  Target,
  WalletCards,
  X,
} from 'lucide-react';

import EmptyState from '@/components/shared/EmptyState';
import MonthSelector from '@/components/shared/MonthSelector';
import TransactionTypeTabs from '@/components/shared/TransactionTypeTabs';
import TransactionRow from '@/components/transactions/TransactionRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAccounts,
  useCategories,
  useTransactions,
} from '@/hooks/useBudgetData';
import { useCurrency } from '@/hooks/useCurrency';
import {
  getCurrencyCode as getSharedCurrencyCode,
  getCurrencySymbol as getSharedCurrencySymbol,
  formatCurrencyNumberText,
} from '@/lib/currencies';
import { cn } from '@/lib/utils';

const ADD_TRANSACTION_ROUTE = '/add-transaction';

const getCurrencyCode = (currency) => getSharedCurrencyCode(currency);
const getCurrencySymbol = (currency) => getSharedCurrencySymbol(currency);

const sourceFilters = [
  { value: 'all', label: 'All sources', shortLabel: 'All sources', icon: WalletCards },
  { value: 'regular', label: 'Regular transactions', shortLabel: 'Regular', icon: ArrowLeftRight },
  { value: 'recurring', label: 'Recurring posts', shortLabel: 'Recurring', icon: Repeat },
  { value: 'goal', label: 'Goal contributions', shortLabel: 'Goals', icon: Target },
];

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'highest', label: 'Highest amount' },
  { value: 'lowest', label: 'Lowest amount' },
];

function formatNumber(value = 0) {
  const number = Number(value || 0);

  return formatCurrencyNumberText(number);
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

function FilterPill({ active, children, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200',
        active
          ? 'border-primary/20 bg-primary/10 text-primary shadow-sm'
          : 'app-card-surface text-muted-foreground hover:brightness-105 hover:text-foreground'
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
      {active && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}

function ActiveFilterChip({ label, onClear }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary/15"
    >
      {label}
      <X className="h-3 w-3" />
    </button>
  );
}

function AdvancedFilterSheet({
  open,
  onOpenChange,
  accounts,
  categories,
  sourceFilter,
  setSourceFilter,
  accountFilter,
  setAccountFilter,
  categoryFilter,
  setCategoryFilter,
  selectedDate,
  setSelectedDate,
  sortBy,
  setSortBy,
  onClearAdvanced,
  activeCount,
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className={cn(
            'h-11 shrink-0 rounded-2xl px-3 shadow-sm',
            activeCount > 0 && 'bg-primary/10 text-primary hover:bg-primary/15'
          )}
          aria-label="Open advanced transaction filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[88vh] overflow-y-auto rounded-t-[2rem] border-border/60 app-card-surface-strong px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-6 backdrop-blur-xl sm:mx-auto sm:max-w-xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle>Advanced filters</SheetTitle>
          <SheetDescription>
            Narrow history by source, account, category, date, or sort order.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section>
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Source
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sourceFilters.map((option) => (
                <FilterPill
                  key={option.value}
                  active={sourceFilter === option.value}
                  icon={option.icon}
                  onClick={() => setSourceFilter(option.value)}
                >
                  {option.shortLabel}
                </FilterPill>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Account
              </label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="h-11 rounded-2xl app-card-surface">
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Category
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-11 rounded-2xl app-card-surface">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Exact date
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="h-11 rounded-2xl app-card-surface pl-9"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Sort
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11 rounded-2xl app-card-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>
        </div>

        <SheetFooter className="mt-6 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={onClearAdvanced}
          >
            Clear filters
          </Button>
          <Button
            type="button"
            className="rounded-2xl"
            onClick={() => onOpenChange(false)}
          >
            Show results
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
  const [accountFilter, setAccountFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const { data: transactions = [] } = useTransactions(currentMonth);
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const formatCurrency = (amount) => (
    <CurrencyAmount amount={amount} currency={currency} compact />
  );

  const sourceByValue = useMemo(
    () => Object.fromEntries(sourceFilters.map((option) => [option.value, option])),
    []
  );

  const activeAdvancedCount = [
    sourceFilter !== 'all',
    accountFilter !== 'all',
    categoryFilter !== 'all',
    Boolean(selectedDate),
    sortBy !== 'newest',
  ].filter(Boolean).length;

  const activeFilterChips = [
    sourceFilter !== 'all'
      ? {
          key: 'source',
          label: sourceByValue[sourceFilter]?.shortLabel || 'Source',
          onClear: () => setSourceFilter('all'),
        }
      : null,
    accountFilter !== 'all'
      ? {
          key: 'account',
          label: accounts.find((account) => account.id === accountFilter)?.name || 'Account',
          onClear: () => setAccountFilter('all'),
        }
      : null,
    categoryFilter !== 'all'
      ? {
          key: 'category',
          label:
            categories.find((category) => category.id === categoryFilter)?.name ||
            'Category',
          onClear: () => setCategoryFilter('all'),
        }
      : null,
    selectedDate
      ? {
          key: 'date',
          label: format(new Date(selectedDate), 'MMM d'),
          onClear: () => setSelectedDate(''),
        }
      : null,
    sortBy !== 'newest'
      ? {
          key: 'sort',
          label: sortOptions.find((option) => option.value === sortBy)?.label || 'Sort',
          onClear: () => setSortBy('newest'),
        }
      : null,
  ].filter(Boolean);

  const filtered = transactions.filter((transaction) => {
    const category = categories.find((c) => c.id === transaction.category_id);
    const fromAccount = accounts.find((a) => a.id === transaction.account_id);
    const toAccount = accounts.find((a) => a.id === transaction.to_account_id);

    const recurring = isRecurringTransaction(transaction);
    const goal = isGoalContribution(transaction);
    const searchValue = search.trim().toLowerCase();

    const sourceLabels = [
      recurring ? 'recurring bill income post' : '',
      goal ? 'goal contribution savings transfer' : '',
      !recurring && !goal ? 'regular manual' : '',
    ];

    const matchSearch =
      !searchValue ||
      category?.name?.toLowerCase().includes(searchValue) ||
      transaction.note?.toLowerCase().includes(searchValue) ||
      fromAccount?.name?.toLowerCase().includes(searchValue) ||
      toAccount?.name?.toLowerCase().includes(searchValue) ||
      transaction.type?.toLowerCase().includes(searchValue) ||
      sourceLabels.some((label) => label.includes(searchValue));

    const matchType = filterType === 'all' || transaction.type === filterType;
    const matchDate = !selectedDate || transaction.date === selectedDate;
    const matchAccount =
      accountFilter === 'all' ||
      transaction.account_id === accountFilter ||
      transaction.to_account_id === accountFilter;
    const matchCategory =
      categoryFilter === 'all' || transaction.category_id === categoryFilter;
    const matchSource =
      sourceFilter === 'all' ||
      (sourceFilter === 'regular' && !recurring && !goal) ||
      (sourceFilter === 'recurring' && recurring) ||
      (sourceFilter === 'goal' && goal);

    return (
      matchSearch &&
      matchType &&
      matchDate &&
      matchAccount &&
      matchCategory &&
      matchSource
    );
  });

  const sortedTransactions = [...filtered].sort((a, b) => {
    if (sortBy === 'oldest') {
      return String(a.date || '').localeCompare(String(b.date || ''));
    }

    if (sortBy === 'highest') {
      return Number(b.amount || 0) - Number(a.amount || 0);
    }

    if (sortBy === 'lowest') {
      return Number(a.amount || 0) - Number(b.amount || 0);
    }

    return String(b.date || '').localeCompare(String(a.date || ''));
  });

  const grouped = sortedTransactions.reduce((groups, transaction) => {
    const transactionDate = transaction.date || 'No Date';

    if (!groups[transactionDate]) groups[transactionDate] = [];

    groups[transactionDate].push(transaction);

    return groups;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    if (sortBy === 'oldest') return a.localeCompare(b);
    return b.localeCompare(a);
  });
  const hasTransactions = sortedDates.length > 0;

  const clearAdvancedFilters = () => {
    setSourceFilter('all');
    setAccountFilter('all');
    setCategoryFilter('all');
    setSelectedDate('');
    setSortBy('newest');
  };

  const handleMonthChange = (nextMonth) => {
    setCurrentMonth(nextMonth);
    setSelectedDate('');
  };

  return (
    <div>
      <div className="mb-4 flex justify-center animate-child">
        <MonthSelector
          currentMonth={currentMonth}
          onChange={handleMonthChange}
          subtitle={`${filtered.length} posted transactions`}
        />
      </div>

      <div className="mb-3 flex gap-2 animate-child">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Find transactions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 rounded-2xl app-card-surface pl-9 pr-9 shadow-sm backdrop-blur-xl"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <AdvancedFilterSheet
          open={filterSheetOpen}
          onOpenChange={setFilterSheetOpen}
          accounts={accounts}
          categories={categories}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          accountFilter={accountFilter}
          setAccountFilter={setAccountFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          selectedDate={selectedDate}
          setSelectedDate={(date) => {
            setSelectedDate(date);
            if (date) setCurrentMonth(format(new Date(date), 'yyyy-MM'));
          }}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onClearAdvanced={clearAdvancedFilters}
          activeCount={activeAdvancedCount}
        />
      </div>

      <TransactionTypeTabs
        value={filterType}
        onChange={setFilterType}
        className="mb-3 animate-child"
      />

      {activeFilterChips.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 animate-child">
          {activeFilterChips.map((chip) => (
            <ActiveFilterChip
              key={chip.key}
              label={chip.label}
              onClear={chip.onClear}
            />
          ))}
          <button
            type="button"
            onClick={clearAdvancedFilters}
            className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {!hasTransactions ? (
        <div className="animate-child">
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions found"
            description="Try changing the month, search, type, or advanced filters."
            actionLabel="Add Transaction"
            onAction={() => navigate(ADD_TRANSACTION_ROUTE)}
          />
        </div>
      ) : (
        <div className="animate-child space-y-4">
          {sortedDates.map((date) => (
            <div
              key={date}
              className="overflow-hidden rounded-2xl app-card-surface"
            >
              <div className="border-b border-border/50 app-card-surface-soft px-4 py-2.5 backdrop-blur-xl">
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
    </div>
  );
}
