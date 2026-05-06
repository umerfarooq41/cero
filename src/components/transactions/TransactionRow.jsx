import React from 'react';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Trash2 } from 'lucide-react';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { cn } from '@/lib/utils';

function CurrencyAmount({ value, formatCurrency }) {
  if (formatCurrency) {
    return <>{formatCurrency(value)}</>;
  }

  return (
    <>
      <img src="/sar.svg" alt="SAR" className="w-3.5 h-3.5 inline-block" />
      <span>
        {Number(Math.abs(value || 0)).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </>
  );
}

function formatTransactionType(type) {
  if (!type) return 'Transaction';

  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getTransferType(account, toAccount) {
  const target = toAccount || account;
  const category = target?.category || target?.type;

  if (!category) return 'Transfer';

  if (category === 'asset') return 'Saving';
  if (category === 'liability') return 'Debt';

  return formatTransactionType(category);
}

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
    income: {
      icon: ArrowDownLeft,
      color: 'text-[hsl(var(--success))]',
      sign: '+',
    },
    expense: {
      icon: ArrowUpRight,
      color: 'text-destructive',
      sign: '-',
    },
    transfer: {
      icon: ArrowLeftRight,
      color: 'text-primary',
      sign: '',
    },
  };

  const config =
    typeConfig[transaction.type] || typeConfig.expense;

  const Icon =
    transaction.type === 'transfer'
      ? ArrowLeftRight
      : null;

  const isTransfer =
    transaction.type === 'transfer';

  const accountName =
    account?.name || 'Account';

  const transactionTypeLabel =
    formatTransactionType(transaction.type);

  const transferTypeLabel =
    getTransferType(account, toAccount);

  const title = isTransfer
    ? [account?.name, toAccount?.name]
        .filter(Boolean)
        .join(' → ')
    : category?.name || 'Uncategorized';

  const primarySubtitle = isTransfer
    ? `Transfer - ${transferTypeLabel}`
    : `${transactionTypeLabel} - ${accountName}`;

  const secondarySubtitle = !isTransfer
    ? transaction.note
    : null;

  const amountValue = Math.abs(
    Number(transaction.amount || 0)
  );

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer group"
    >
      {isTransfer ? (
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
        <div className="text-sm font-medium truncate">
          {title}
        </div>

        {primarySubtitle && (
          <div className="text-xs text-muted-foreground truncate">
            {primarySubtitle}
          </div>
        )}

        {secondarySubtitle && (
          <div className="text-[11px] text-muted-foreground/80 truncate">
            {secondarySubtitle}
          </div>
        )}
      </div>

      <div className="text-right shrink-0">
        <div
          className={cn(
            'text-sm font-semibold tabular-nums inline-flex items-center gap-1',
            config.color
          )}
        >
          {config.sign}

          <CurrencyAmount
            value={amountValue}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.();
        }}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded-md transition-all"
      >
        <Trash2 className="w-3.5 h-3.5 text-destructive" />
      </button>
    </div>
  );
}