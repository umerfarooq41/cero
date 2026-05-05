import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Search, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/budgetData';
import { toast } from 'sonner';
import MonthSelector from '@/components/shared/MonthSelector';
import TransactionRow from '@/components/transactions/TransactionRow';
import EmptyState from '@/components/shared/EmptyState';
import { useTransactions, useCategories, useAccounts } from '@/hooks/useBudgetData';
import { useCurrencyFormatter } from '@/hooks/useCurrency';

export default function Transactions() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const queryClient = useQueryClient();

  const formatCurrency = useCurrencyFormatter(); // ✅ important

  const { data: transactions } = useTransactions(currentMonth);
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();

  const filtered = transactions.filter(t => {
    const cat = categories.find(c => c.id === t.category_id);
    const matchSearch =
      !search ||
      cat?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.note?.toLowerCase().includes(search.toLowerCase());

    const matchType = filterType === 'all' || t.type === filterType;

    return matchSearch && matchType;
  });

  const grouped = filtered.reduce((groups, t) => {
    const date = t.date || 'No Date';
    if (!groups[date]) groups[date] = [];
    groups[date].push(t);
    return groups;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const handleDelete = async (id) => {
    try {
      await transactionsApi.delete(id);
      queryClient.invalidateQueries();
      toast.success('Transaction deleted');
    } catch (error) {
      console.error('Transaction delete failed:', error);
      toast.error(error.message || 'Could not delete transaction');
    }
  };

  const filterButtons = [
    { value: 'all', label: 'All' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
    { value: 'transfer', label: 'Transfer' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 lg:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} transactions
          </p>
        </div>
        <MonthSelector currentMonth={currentMonth} onChange={setCurrentMonth} />
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="flex gap-1.5 mb-6">
        {filterButtons.map(f => (
          <button
            key={f.value}
            onClick={() => setFilterType(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filterType === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {sortedDates.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions yet"
          description="Add your first transaction to start tracking your spending."
          actionLabel="Add Transaction"
          onAction={() => window.location.href = '/add-transaction'}
        />
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => (
            <div key={date} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-accent/30">
                <span className="text-xs font-semibold text-muted-foreground">
                  {date !== 'No Date'
                    ? format(new Date(date), 'EEEE, MMM d')
                    : 'No Date'}
                </span>
              </div>

              <div className="divide-y divide-border/50">
                {grouped[date].map(t => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    category={categories.find(c => c.id === t.category_id)}
                    account={accounts.find(a => a.id === t.account_id)}
                    toAccount={accounts.find(a => a.id === t.to_account_id)}
                    formatCurrency={formatCurrency} // ✅ pass formatter
                    onDelete={() => handleDelete(t.id)}
                    onClick={() => navigate(`/transactions/${t.id}/edit`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/add-transaction">
        <Button className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl shadow-lg shadow-primary/25 p-0">
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  );
}