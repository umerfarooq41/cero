import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccounts, useAllTransactions, useCategories, formatCurrency } from '@/hooks/useBudgetData';
import TransactionRow from '@/components/transactions/TransactionRow';
import EmptyState from '@/components/shared/EmptyState';
import { useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/budgetData';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AccountDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accountId = window.location.pathname.split('/').pop();

  const { data: accounts } = useAccounts();
  const { data: allTransactions } = useAllTransactions();
  const { data: categories } = useCategories();

  const account = accounts.find(a => a.id === accountId);
  const transactions = allTransactions
    .filter(t => t.account_id === accountId || t.to_account_id === accountId)
    .slice(0, 50);

  const handleDelete = async (id) => {
    try {
      await transactionsApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ['all-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction deleted');
    } catch (error) {
      console.error('Transaction delete failed:', error);
      toast.error(error.message || 'Could not delete transaction');
    }
  };

  if (!account) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <p className="text-muted-foreground">Account not found</p>
        <Button variant="ghost" onClick={() => navigate('/accounts')} className="mt-4">
          Back to Accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 lg:py-10">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/accounts')} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">{account.name}</h1>
          <p className="text-xs text-muted-foreground capitalize">{account.type?.replace('_', ' ')}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate(`/accounts/${accountId}/edit`)}>
          <PencilLine className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 mb-8 text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Balance</div>
        <div className={cn(
          "text-4xl font-bold tracking-tight",
          account.category === 'liability' ? "text-destructive" : "text-foreground"
        )}>
          {account.category === 'liability' ? '-' : ''}{formatCurrency(Math.abs(account.balance || 0))}
        </div>
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Recent Transactions
      </h2>

      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions"
          description="No transactions for this account yet."
        />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border/50">
          {transactions.map(t => (
            <TransactionRow
              key={t.id}
              transaction={t}
              category={categories.find(c => c.id === t.category_id)}
              account={accounts.find(a => a.id === t.account_id)}
              toAccount={accounts.find(a => a.id === t.to_account_id)}
              onDelete={() => handleDelete(t.id)}
              onClick={() => navigate(`/transactions/${t.id}/edit`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
