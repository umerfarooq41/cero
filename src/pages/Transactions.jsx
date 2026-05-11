import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Search, ArrowLeftRight, X } from 'lucide-react';

import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MonthSelector from '@/components/shared/MonthSelector';
import TransactionRow from '@/components/transactions/TransactionRow';
import EmptyState from '@/components/shared/EmptyState';
import { useTransactions, useCategories, useAccounts } from '@/hooks/useBudgetData';
import { useCurrencyFormatter } from '@/hooks/useCurrency';

const ADD_TRANSACTION_ROUTE = '/add-transaction';

export default function Transactions() {
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const formatCurrency = useCurrencyFormatter();

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

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const hasTransactions = sortedDates.length > 0;

  const filterButtons = [
    { value: 'all', label: 'All' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'transfer', label: 'Transfer' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Transactions"
        subtitle={`${filtered.length} transactions this month`}
      />

      <main className="mx-auto w-full max-w-3xl px-4 py-4 pb-24 lg:py-8">
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MonthSelector
            currentMonth={currentMonth}
            onChange={(month) => {
              setCurrentMonth(month);
              setSelectedDate('');
            }}
          />

          <div className="flex gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10"
            />

            {selectedDate && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => setSelectedDate('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4 flex gap-2">
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

        <div className="mb-6 flex gap-1.5 overflow-x-auto">
          {filterButtons.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilterType(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterType === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!hasTransactions ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions yet"
            description="Add your first transaction to start tracking your spending."
            actionLabel="Add Transaction"
            onAction={() => navigate(ADD_TRANSACTION_ROUTE)}
          />
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => (
              <div
                key={date}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="border-b border-border bg-accent/30 px-4 py-2.5">
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
                      category={categories.find((c) => c.id === t.category_id)}
                      account={accounts.find((a) => a.id === t.account_id)}
                      toAccount={accounts.find((a) => a.id === t.to_account_id)}
                      formatCurrency={formatCurrency}
                      onClick={() => navigate(`/transactions/${t.id}/edit`)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {hasTransactions && (
          <Link to={ADD_TRANSACTION_ROUTE}>
            <Button className="fixed bottom-24 right-5 z-50 h-14 w-14 rounded-2xl p-0 shadow-lg shadow-primary/25 lg:bottom-6">
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
        )}
      </main>
    </div>
  );
}