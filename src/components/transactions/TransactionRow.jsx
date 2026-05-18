import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';
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
      <img
        src="/sar.svg"
        alt="SAR"
        className="inline-block h-4 w-4 dark:invert"
      />
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
  onClick,
}) {
  const transactionType = transaction?.type || 'expense';

  const typeConfig = {
    income: {
      color: 'text-[hsl(var(--success))]',
      sign: '+',
    },
    expense: {
      color: 'text-destructive',
      sign: '-',
    },
    transfer: {
      color: 'text-primary',
      sign: '',
    },
  };

  const config = typeConfig[transactionType] || typeConfig.expense;
  const isTransfer = transactionType === 'transfer';

  const accountName = account?.name || 'Account';
  const transactionTypeLabel = formatTransactionType(transactionType);
  const transferTypeLabel = getTransferType(account, toAccount);

  const title = isTransfer
    ? [account?.name, toAccount?.name].filter(Boolean).join(' → ')
    : category?.name || 'Uncategorized';

  const transferCategoryName = category?.name || transferTypeLabel || 'Transfer';

  const primarySubtitle = isTransfer
    ? `Transfer - ${transferCategoryName}`
    : `${transactionTypeLabel} - ${accountName}`;

  const secondarySubtitle = !isTransfer ? transaction?.note : null;
  const amountValue = Math.abs(Number(transaction?.amount || 0));

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.985, x: 2 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      className={cn(
        `
        relative flex min-h-[64px] cursor-pointer items-center gap-3
        px-3 py-3
        transition-colors
        hover:bg-accent/50
        before:absolute before:left-0 before:top-3 before:bottom-3
        before:w-0.5 before:rounded-full before:content-['']
        `,
        transactionType === 'income' && 'before:bg-[hsl(var(--success))]',
        transactionType === 'expense' && 'before:bg-destructive',
        transactionType === 'transfer' && 'before:bg-primary'
      )}
    >
      {isTransfer ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ArrowLeftRight className="h-4 w-4 stroke-[2.2]" />
        </div>
      ) : (
        <CategoryIcon
          icon={category?.icon || 'tag'}
          color={category?.color}
          size="sm"
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>

        {primarySubtitle && (
          <div className="truncate text-xs text-muted-foreground">
            {primarySubtitle}
          </div>
        )}

        {secondarySubtitle && (
          <div className="truncate text-xs text-muted-foreground/80">
            {secondarySubtitle}
          </div>
        )}
      </div>

      <div className="shrink-0 text-right">
        <div
          className={cn(
            'inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold tabular-nums',
            config.color
          )}
        >
          {config.sign && <span>{config.sign}</span>}

          <CurrencyAmount value={amountValue} formatCurrency={formatCurrency} />
        </div>
      </div>
    </motion.div>
  );
}