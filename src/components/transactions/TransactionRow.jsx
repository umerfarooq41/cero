import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { cn } from '@/lib/utils';

function CurrencyAmount({ value, formatCurrency }) {
  if (formatCurrency) {
    return (
      <span className="inline-flex items-center align-middle whitespace-nowrap tabular-nums">
        {formatCurrency(value)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 align-middle whitespace-nowrap tabular-nums">
      <img src="/sar.svg" alt="SAR" className="h-4 w-4 inline-block dark:invert" />
      <span className="tabular-nums">
        {Number(Math.abs(value || 0)).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </span>
  );
}

function formatTransactionType(type) {
  if (!type) return 'Transaction';
  return type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getTransferType(account, toAccount) {
  const target = toAccount || account;
  const category = target?.category || target?.type;
  if (!category) return 'Transfer';
  if (category === 'asset') return 'Saving';
  if (category === 'liability') return 'Debt';
  return formatTransactionType(category);
}

const TYPE_ACCENT = {
  income:   'before:bg-[hsl(var(--success))]',
  expense:  'before:bg-destructive',
  transfer: 'before:bg-primary',
};

export default function TransactionRow({
  transaction,
  category,
  account,
  toAccount,
  formatCurrency,
  onClick,
}) {
  const typeConfig = {
    income:   { color: 'text-[hsl(var(--success))]', sign: '+' },
    expense:  { color: 'text-destructive',             sign: '-' },
    transfer: { color: 'text-primary',                 sign: ''  },
  };

  const config = typeConfig[transaction.type] || typeConfig.expense;
  const isTransfer = transaction.type === 'transfer';
  const accentClass = TYPE_ACCENT[transaction.type] || TYPE_ACCENT.expense;

  const title = isTransfer
    ? [account?.name, toAccount?.name].filter(Boolean).join(' → ')
    : category?.name || 'Uncategorized';

  const transferCategoryName = category?.name || getTransferType(account, toAccount) || 'Transfer';
  const primarySubtitle = isTransfer
    ? `Transfer - ${transferCategoryName}`
    : `${formatTransactionType(transaction.type)} - ${account?.name || 'Account'}`;
  const secondarySubtitle = !isTransfer ? transaction.note : null;
  const amountValue = Math.abs(Number(transaction.amount || 0));

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.985, x: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'relative flex items-center gap-3 px-3 py-3 min-h-[64px]',
        'hover:bg-accent/50 transition-colors cursor-pointer',
        // left-edge accent stripe by type
        'before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full',
        accentClass
      )}
    >
      {isTransfer ? (
        <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-primary/10 text-primary shrink-0">
          <ArrowLeftRight className="h-4 w-4 stroke-[2.2]" />
        </div>
      ) : (
        <CategoryIcon icon={category?.icon || 'tag'} color={category?.color} size="sm" />
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {primarySubtitle && (
          <div className="text-xs text-muted-foreground truncate">{primarySubtitle}</div>
        )}
        {secondarySubtitle && (
          <div className="text-xs text-muted-foreground/80 truncate">{secondarySubtitle}</div>
        )}
      </div>

      <div className="text-right shrink-0">
        <div className={cn(
          'text-sm font-semibold tabular-nums inline-flex items-center gap-1 whitespace-nowrap',
          config.color
        )}>
          {config.sign && <span>{config.sign}</span>}
          <CurrencyAmount value={amountValue} formatCurrency={formatCurrency} />
        </div>
      </div>
    </motion.div>
  );
}
