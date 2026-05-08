import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarDays,
  Plus,
  ReceiptText,
  Search,
  WalletCards,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import {
  GlassCard,
  MetricCard,
  PageHeader,
  TonePill,
} from '@/components/shared/Premium';

const ADD_TRANSACTION_ROUTE = '/add-transaction';

const filterButtons = [
  { value: 'all', label: 'All', tone: 'default' },
  { value: 'income', label: 'Income', tone: 'income' },
  { value: 'expense', label: 'Expense', tone: 'expense' },
  { value: 'transfer', label: 'Transfer', tone: 'transfer' },
];

export default function Transactions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const formatCurrency = useCurrencyFormatter();

  const { data: transactions = [], isLoading } = useTransactions(currentMonth);
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const summary = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

    const expense = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

    const transfer = transactions
      .filter((transaction) => transaction.type === 'transfer')
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);

    return {
      income,
      expense,
      transfer,
      net: income - expense,
    };
  }, [transactions]);

  const filtered = transactions.filter((transaction) => {
    const category = categories.find((item) => item.id === transaction.category_id);
    const account = accounts.find((item) => item.id === transaction.account_id);
    const toAccount = accounts.find((item) => item.id === transaction.to_account_id);
    const query = search.toLowerCase();

    const matchSearch =
      !query ||
      category?.name?.toLowerCase().includes(query) ||
      transaction.note?.toLowerCase().includes(query) ||
      account?.name?.toLowerCase().includes(query) ||
      toAccount?.name?.toLowerCase().includes(query);

    const matchType = filterType === 'all' || transaction.type === filterType;

    return matchSearch && matchType;
  });

  const grouped = filtered.reduce((groups, transaction) => {
    const txDate = transaction.date || 'No Date';
    if (!groups[txDate]) groups[txDate] = [];
    groups[txDate].push(transaction);
    return groups;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const hasTransactions = sortedDates.length > 0;

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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 pb-nav sm:px-6 lg:py-10">
      <PageHeader
        title="Transactions"
        description={`${filtered.length} shown from ${transactions.length} this month`}
        icon={ReceiptText}
        actions={<MonthSelector currentMonth={currentMonth} onChange={setCurrentMonth} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Income"
          value={formatCurrency(summary.income)}
          icon={ArrowDownRight}
          tone="income"
          delay={0.02}
        />
        <MetricCard
          label="Expenses"
          value={formatCurrency(summary.expense)}
          icon={ArrowUpRight}
          tone="expense"
          delay={0.04}
        />
        <MetricCard
          label="Transfers"
          value={formatCurrency(summary.transfer)}
          icon={ArrowLeftRight}
          tone="transfer"
          delay={0.06}
        />
        <MetricCard
          label="Net Cash Flow"
          value={
            <>
              {summary.net < 0 && <span>-</span>}
              {summary.net > 0 && <span>+</span>}
              {formatCurrency(Math.abs(summary.net))}
            </>
          }
          detail={summary.net >= 0 ? 'Positive after expenses' : 'Spending exceeded income'}
          icon={WalletCards}
          tone={summary.net >= 0 ? 'savings' : 'debt'}
          delay={0.08}
        />
      </div>

      <GlassCard className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search category, account, or note"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-12 rounded-2xl border-transparent bg-secondary/70 pl-11 shadow-none focus-visible:ring-1"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {filterButtons.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setFilterType(filter.value)}
                className={cn(
                  'shrink-0 rounded-2xl px-3.5 py-2 text-xs font-semibold transition-all',
                  filterType === filter.value
                    ? 'bg-foreground text-background shadow-sm dark:bg-white dark:text-background'
                    : 'bg-secondary/70 text-muted-foreground hover:text-foreground'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-3xl bg-muted/70" />
          ))}
        </div>
      ) : !hasTransactions ? (
        <GlassCard className="p-2">
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions yet"
            description="Add the first movement of money and Cero will start building your monthly view."
            actionLabel="Add Transaction"
            onAction={() => navigate(ADD_TRANSACTION_ROUTE)}
          />
        </GlassCard>
      ) : (
        <div className="space-y-5">
          {sortedDates.map((date) => {
            const label = date !== 'No Date' ? format(new Date(date), 'EEEE, MMM d') : 'No Date';
            const count = grouped[date].length;

            return (
              <section key={date} className="space-y-2">
                <div className="sticky top-3 z-20 flex items-center justify-between rounded-2xl border border-border/70 bg-background px-3 py-2 text-xs font-semibold text-muted-foreground shadow-sm">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {label}
                  </span>
                  <TonePill className="px-2 py-0.5" tone="default">
                    {count}
                  </TonePill>
                </div>

                <div className="space-y-2">
                  {grouped[date].map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      category={categories.find((item) => item.id === transaction.category_id)}
                      account={accounts.find((item) => item.id === transaction.account_id)}
                      toAccount={accounts.find((item) => item.id === transaction.to_account_id)}
                      formatCurrency={formatCurrency}
                      onDelete={() => handleDelete(transaction.id)}
                      onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Link to={ADD_TRANSACTION_ROUTE} className="fixed bottom-28 right-5 z-40 sm:right-8">
        <Button
          className="h-14 w-14 rounded-[1.35rem] p-0 shadow-[0_18px_40px_rgba(37,99,235,0.28)]"
          size="icon"
          aria-label="Add transaction"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
