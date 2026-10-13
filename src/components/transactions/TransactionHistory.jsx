import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeftRight,
  CalendarDays,
  Repeat,
  Search,
  SlidersHorizontal,
  Target,
  WalletCards,
  X,
} from 'lucide-react';

import EmptyState from '@/components/shared/EmptyState';
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
  useRecurringTransactions,
  useSavingsGoals,
  useTransactions,
  useAllTransactions,
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
        'inline-flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[11px] font-medium transition-colors sm:gap-1.5 sm:px-2 sm:text-xs',
        active
          ? 'bg-primary/10 text-primary'
          : 'bg-muted/35 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" strokeWidth={2} />}
      <span className="whitespace-nowrap">{children}</span>
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
  dateMode,
  setDateMode,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
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
            'h-10 shrink-0 rounded-xl px-3',
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
        className="flex max-h-[88dvh] flex-col overflow-hidden rounded-t-[1.75rem] border-0 bg-background px-4 pb-[env(safe-area-inset-bottom)] pt-4 shadow-xl sm:mx-auto sm:max-w-xl"
      >
        <SheetHeader className="shrink-0 pb-3 text-left">
          <SheetTitle className="text-lg font-semibold">Filter transactions</SheetTitle>
          <SheetDescription className="sr-only">Filter transaction history by source, account, category, date, and sort order.</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-3">
          <section>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Source</label>
            <div className="grid grid-cols-4 gap-1.5">
              {sourceFilters.map((option) => (
                <FilterPill key={option.value} active={sourceFilter === option.value}
                  icon={option.icon} onClick={() => setSourceFilter(option.value)}>
                  {option.value === 'all' ? 'All' : option.shortLabel}
                </FilterPill>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Account</label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-muted/35 px-2.5 text-xs">
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-muted/35 px-2.5 text-xs">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Date</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[['any', 'Any date'], ['exact', 'Exact'], ['range', 'Range']].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setDateMode(value)}
                  className={cn('h-9 rounded-xl text-xs font-medium', dateMode === value ? 'bg-primary/10 text-primary' : 'bg-muted/35 text-muted-foreground')}>
                  {label}
                </button>
              ))}
            </div>
            {dateMode === 'exact' && <Input aria-label="Exact date" type="date" value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)} className="mt-2 h-10 rounded-xl bg-muted/35 text-xs"/>}
            {dateMode === 'range' && <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="min-w-0"><label className="mb-1 block text-[11px] text-muted-foreground">From</label>
                <Input aria-label="From date" type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} className="h-10 min-w-0 rounded-xl bg-muted/35 px-2 text-xs"/></div>
              <div className="min-w-0"><label className="mb-1 block text-[11px] text-muted-foreground">To</label>
                <Input aria-label="To date" type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} className="h-10 min-w-0 rounded-xl bg-muted/35 px-2 text-xs"/></div>
            </div>}
          </section>
          <section>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Sort by</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-10 w-full rounded-xl bg-muted/35 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{sortOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </section>
        </div>

        <SheetFooter className="shrink-0 flex-row gap-2 border-t border-border/40 py-3 sm:gap-2">
          <Button type="button" variant="ghost" className="h-10 flex-1 rounded-xl text-muted-foreground"
            onClick={onClearAdvanced}>Clear</Button>
          <Button type="button" className="h-10 flex-[2] rounded-xl"
            onClick={() => onOpenChange(false)}>Show results</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function TransactionHistory({ currentMonth, onMonthChange }) {
  const navigate = useNavigate();
  const currency = useCurrency();

  const [selectedDate, setSelectedDate] = useState('');
  const [dateMode, setDateMode] = useState('any');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const {
    data: transactions = [],
    isPending: transactionsPending,
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useTransactions(currentMonth);
  const { data: allTransactions = [] } = useAllTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: recurringTransactions = [] } = useRecurringTransactions();
  const { data: savingsGoals = [] } = useSavingsGoals();

  const recurringById = useMemo(
    () => new Map(recurringTransactions.map((rule) => [rule.id, rule])),
    [recurringTransactions]
  );
  const goalsById = useMemo(
    () => new Map(savingsGoals.map((goal) => [goal.id, goal])),
    [savingsGoals]
  );

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
    (dateMode === "exact" && Boolean(selectedDate)) || (dateMode === "range" && Boolean(dateFrom || dateTo)),
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
    dateMode === "exact" && selectedDate
      ? {
          key: 'date',
          label: format(new Date(selectedDate), 'MMM d'),
          onClear: () => { setSelectedDate(''); setDateMode('any'); },
        }
      : null,
    dateMode === 'range' && (dateFrom || dateTo) ? { key: 'range', label: `${dateFrom || 'Start'} – ${dateTo || 'End'}`, onClear: () => { setDateFrom(''); setDateTo(''); setDateMode('any'); } } : null,
    sortBy !== 'newest'
      ? {
          key: 'sort',
          label: sortOptions.find((option) => option.value === sortBy)?.label || 'Sort',
          onClear: () => setSortBy('newest'),
        }
      : null,
  ].filter(Boolean);

  const accountsById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );
  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const searchValue = search.trim().toLowerCase();

  const { filtered, grouped, sortedDates } = useMemo(() => {
  const visibleTransactions = dateMode === "range" && (dateFrom || dateTo) ? allTransactions : transactions;
  const filtered = visibleTransactions.filter((transaction) => {
    const category = categoriesById.get(transaction.category_id);
    const fromAccount = accountsById.get(transaction.account_id);
    const toAccount = accountsById.get(transaction.to_account_id);

    const recurring = isRecurringTransaction(transaction);
    const goal = isGoalContribution(transaction);

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
      transaction.account_name_snapshot?.toLowerCase().includes(searchValue) ||
      transaction.to_account_name_snapshot?.toLowerCase().includes(searchValue) ||
      transaction.type?.toLowerCase().includes(searchValue) ||
      sourceLabels.some((label) => label.includes(searchValue));

    const matchType = filterType === 'all' || transaction.type === filterType;
    const matchDate = dateMode === "range" ? (!dateFrom || transaction.date >= dateFrom) && (!dateTo || transaction.date <= dateTo) : dateMode !== "exact" || !selectedDate || transaction.date === selectedDate;
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
    return { filtered, grouped, sortedDates };
  }, [
    transactions, allTransactions, dateMode, dateFrom, dateTo, accountsById, categoriesById, searchValue,
    filterType, selectedDate, accountFilter, categoryFilter, sourceFilter, sortBy,
  ]);

  const hasTransactions = sortedDates.length > 0;

  const clearAdvancedFilters = () => {
    setSourceFilter('all');
    setAccountFilter('all');
    setCategoryFilter('all');
    setSelectedDate('');
    setDateMode('any');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
  };

  const handleMonthChange = (nextMonth) => {
    onMonthChange(nextMonth);
    setSelectedDate('');
  };

  return (
    <div>
      <div className="mb-2 text-xs text-muted-foreground">{filtered.length} posted transactions</div>
      <div className="mb-2 flex gap-2 animate-child">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Find transactions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 rounded-xl app-card-surface pl-9 pr-9"
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
          dateMode={dateMode}
          setDateMode={setDateMode}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          setSelectedDate={(date) => {
            setSelectedDate(date);
            if (date) onMonthChange(format(new Date(date), 'yyyy-MM'));
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
        className="mb-2 animate-child"
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

      {transactionsPending ? (
        <div className="animate-child flex min-h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        </div>
      ) : transactionsError ? (
        <div className="animate-child">
          <EmptyState
            icon={ArrowLeftRight}
            title="Couldn't load transactions"
            description="Your data has not been changed. Check your connection and try again."
            actionLabel="Retry"
            onAction={() => refetchTransactions()}
          />
        </div>
      ) : !hasTransactions ? (
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
        <div className="animate-child space-y-3">
          {sortedDates.map((date) => (
            <div
              key={date}
              className="overflow-hidden rounded-2xl app-card-surface"
            >
              <div className="border-b border-border/50 bg-muted/25 px-3 py-2">
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
                    recurringRule={recurringById.get(transaction.recurring_transaction_id)}
                    goal={goalsById.get(transaction.savings_goal_id || transaction.goal_id)}
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
