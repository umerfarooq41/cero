import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { MoneyAmount } from '@/components/shared/Premium';
import { cn } from '@/lib/utils';

function CurrencyAmount({ value, formatCurrency }) {
  if (formatCurrency) {
    return <MoneyAmount>{formatCurrency(value)}</MoneyAmount>;
  }

  return (
    <MoneyAmount className="gap-1">
      <img src="/sar.svg" alt="SAR" className="h-3.5 w-3.5 dark:invert" />
      <span>
        {Number(Math.abs(value || 0)).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </MoneyAmount>
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
      color: 'text-foreground',
      sign: '+',
      bg: 'bg-card hover:bg-secondary/45',
      border: 'border-border/70',
      icon: ArrowDownLeft,
      iconBg: 'bg-secondary text-muted-foreground',
    },
    expense: {
      color: 'text-foreground',
      sign: '-',
      bg: 'bg-card hover:bg-secondary/45',
      border: 'border-border/70',
      icon: ArrowUpRight,
      iconBg: 'bg-secondary text-muted-foreground',
    },
    transfer: {
      color: 'text-foreground',
      sign: '',
      bg: 'bg-card hover:bg-secondary/45',
      border: 'border-border/70',
      icon: ArrowLeftRight,
      iconBg: 'bg-secondary text-muted-foreground',
    },
  };

  const config = typeConfig[transaction.type] || typeConfig.expense;
  const isTransfer = transaction.type === 'transfer';
  const TypeIcon = config.icon;

  const accountName = account?.name || 'Account';
  const transactionTypeLabel = formatTransactionType(transaction.type);
  const transferTypeLabel = getTransferType(account, toAccount);

  const title = isTransfer
    ? [account?.name, toAccount?.name].filter(Boolean).join(' to ')
    : category?.name || 'Uncategorized';

  const primarySubtitle = isTransfer
    ? `Transfer - ${transferTypeLabel}`
    : `${transactionTypeLabel} - ${accountName}`;

  const secondarySubtitle = !isTransfer ? transaction.note : null;
  const amountValue = Math.abs(Number(transaction.amount || 0));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      className={cn(
        'group flex cursor-pointer items-center gap-3 rounded-[1.25rem] border px-3 py-3 shadow-sm transition-all',
        config.bg,
        config.border
      )}
    >
      {isTransfer ? (
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', config.iconBg)}>
          <ArrowLeftRight className="h-4 w-4 stroke-[2.2]" />
        </div>
      ) : (
        <div className="relative">
          <CategoryIcon
            icon={category?.icon || 'tag'}
            color={category?.color}
            size="md"
            className="rounded-2xl"
          />
          <span className={cn('absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-background', config.iconBg)}>
            <TypeIcon className="h-3 w-3" />
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{title}</div>

        {primarySubtitle && (
          <div className="mt-1 truncate text-xs text-muted-foreground">
            {primarySubtitle}
          </div>
        )}

        {secondarySubtitle && (
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
            {secondarySubtitle}
          </div>
        )}
      </div>

      <div className="shrink-0 text-right">
        <div className={cn('inline-flex items-center gap-1 whitespace-nowrap text-sm font-bold tabular-nums', config.color)}>
          {config.sign && <span>{config.sign}</span>}
          <CurrencyAmount value={amountValue} formatCurrency={formatCurrency} />
        </div>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete?.();
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-muted-foreground opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
        aria-label="Delete transaction"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
