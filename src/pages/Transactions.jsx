import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, subMonths } from 'date-fns';
import {
  Search,
  ArrowLeftRight,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TransactionRow from '@/components/transactions/TransactionRow';
import EmptyState from '@/components/shared/EmptyState';
import FloatingActionButton from '@/components/shared/FloatingActionButton';
import TransactionTypeTabs from '@/components/shared/TransactionTypeTabs';

import {
  useTransactions,
  useCategories,
  useAccounts,
} from '@/hooks/useBudgetData';

import { useCurrency } from '@/hooks/useCurrency';
import { usePageEntrance } from '@/hooks/usePageTransition';
import {
  getCurrencyCode as getSharedCurrencyCode,
  getCurrencySymbol as getSharedCurrencySymbol,
} from '@/lib/currencies';
import { cn } from '@/lib/utils';


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

const ADD_TRANSACTION_ROUTE = '/add-transaction';

export default function Transactions() {
  const scope = usePageEntrance();
  const navigate = useNavigate();
  const currency = useCurrency();

  const [currentMonth, setCurrentMonth] = useState(
    format(new Date(), 'yyyy-MM')
  );

  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const formatCurrency = (amount) => (
    <CurrencyAmount amount={amount} currency={currency} compact />
  );

  const { data: transactions = [] } = useTransactions(currentMonth);
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const filtered = transactions.filter((t) => {
    const cat = categories.find((c) => c.id === t.category_id);
    const fromAccount = accounts.find((a) => a.id === t.account_id);
    const toAccount = accounts.find((a) => a.id === t.to_account_id);

    const searchValue = search.toLowerCase();

    const matchSearch =
      !search ||
      cat?.name?.toLowerCase().includes(searchValue) ||
      t.note?.toLowerCase().includes(searchValue) ||
      fromAccount?.name?.toLowerCase().includes(searchValue) ||
      toAccount?.name?.toLowerCase().includes(searchValue);

    const matchType = filterType === 'all' || t.type === filterType;
    const matchDate = !selectedDate || t.date === selectedDate;

    return matchSearch && matchType && matchDate;
  });

  const grouped = filtered.reduce((groups, t) => {
    const txDate = t.date || 'No Date';

    if (!groups[txDate]) groups[txDate] = [];

    groups[txDate].push(t);

    return groups;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) =>
    b.localeCompare(a)
  );

  const hasTransactions = sortedDates.length > 0;


  const goToPreviousMonth = () => {
    setCurrentMonth((prev) =>
      format(subMonths(new Date(`${prev}-01`), 1), 'yyyy-MM')
    );
    setSelectedDate('');
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) =>
      format(addMonths(new Date(`${prev}-01`), 1), 'yyyy-MM')
    );
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
    <div ref={scope} className="min-h-screen bg-transparent">
      <PageHeader
        className="animate-child"
        title="Transactions"
        subtitle={`${filtered.length} transactions this month`}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-24 lg:py-8">
        {/* Month + Date */}
        <div className="mb-4 flex justify-center animate-child">
          <div className="flex w-full max-w-md items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-card/70 p-1.5 shadow-sm backdrop-blur-xl">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <button
              type="button"
              onClick={openDatePicker}
              className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-3 py-1.5 text-center transition-colors hover:bg-secondary/70"
            >
              <span className="text-sm font-semibold text-foreground">
                {format(new Date(`${currentMonth}-01`), 'MMMM yyyy')}
              </span>

              {selectedDate && (
                <span className="mt-0.5 text-xs text-muted-foreground">
                  {format(new Date(selectedDate), 'MMM d, yyyy')}
                </span>
              )}
            </button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <label className="relative h-9 w-9 shrink-0 cursor-pointer">
  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80">
    <CalendarDays className="h-4 w-4" />
  </span>

  <Input
    id="transaction-date-picker"
    type="date"
    value={selectedDate}
    onChange={(e) => {
      const date = e.target.value;
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
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 flex gap-2 animate-child">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
        </div>

        {/* Filters */}
        <TransactionTypeTabs
          value={filterType}
          onChange={setFilterType}
          className="mb-6 animate-child"
        />

        {/* Empty */}
        {!hasTransactions ? (
          <div className="animate-child">
            <EmptyState
              icon={ArrowLeftRight}
            title="No transactions yet"
            description="Add your first transaction to start tracking your spending."
            actionLabel="Add Transaction"
            onAction={() => navigate(ADD_TRANSACTION_ROUTE)}
            />
          </div>
        ) : (
          <div className="animate-child space-y-4">
            {sortedDates.map((date) => (
              <div
                key={date}
                className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-sm"
              >
                <div className="border-b border-border/50 bg-card/50 px-4 py-2.5 backdrop-blur-xl">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {date !== 'No Date'
                      ? format(new Date(date), 'EEEE, MMM d')
                      : 'No Date'}
                  </span>
                </div>

                <div className="divide-y divide-border/50">
                  {grouped[date].map((t) => (
                    <TransactionRow
                      key={t.id}
                      transaction={t}
                      category={categories.find(
                        (c) => c.id === t.category_id
                      )}
                      account={accounts.find(
                        (a) => a.id === t.account_id
                      )}
                      toAccount={accounts.find(
                        (a) => a.id === t.to_account_id
                      )}
                      formatCurrency={formatCurrency}
                      onClick={() =>
                        navigate(`/transactions/${t.id}/edit`)
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Add Button */}
        {hasTransactions && (
          <FloatingActionButton
            to={ADD_TRANSACTION_ROUTE}
            ariaLabel="Add transaction"
          />
        )}
      </main>
    </div>
  );
}