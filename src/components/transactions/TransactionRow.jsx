import React from 'react';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Trash2 } from 'lucide-react';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { cn } from '@/lib/utils';

export default function TransactionRow({
  transaction,
  category,
  account,
  toAccount,
  formatCurrency,
  onDelete,
  onClick,
}) {
  const typeConfig = {
    income: { icon: ArrowDownLeft, color: 'text-[hsl(var(--success))]', sign: '+' },
    expense: { icon: ArrowUpRight, color: 'text-destructive', sign: '-' },
    transfer: { icon: ArrowLeftRight, color: 'text-primary', sign: '' },
  };

  const config = typeConfig[transaction.type] || typeConfig.expense;
  const Icon = transaction.type === 'transfer' ? ArrowLeftRight : null;
  const title = transaction.type === 'transfer' ? 'Transfer' : category?.name || 'Uncategorized';

  const subtitle =
    transaction.type === 'transfer'
      ? [account?.name, toAccount?.name].filter(Boolean).join(' → ')
      : transaction.note;

  const amount = formatCurrency
    ? formatCurrency(transaction.amount)
    : Number(Math.abs(transaction.amount || 0)).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer group"
    >
      {transaction.type === 'transfer' ? (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      ) : (
        <CategoryIcon
          icon={category?.icon || 'tag'}
          color={category?.color}
          size="sm"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
        )}
      </div>

      <div className="text-right shrink-0">
        <div className={cn("text-sm font-semibold tabular-nums inline-flex items-center gap-1", config.color)}>
          {config.sign}
          {amount}
        </div>

        {transaction.type !== 'transfer' && account && (
          <div className="text-[11px] text-muted-foreground">{account.name}</div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded-md transition-all"
      >
        <Trash2 className="w-3.5 h-3.5 text-destructive" />
      </button>
    </div>
  );
}