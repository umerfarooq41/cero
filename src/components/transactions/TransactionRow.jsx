import React from 'react';
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
        className="h-4 w-4 inline-block dark:invert"
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

  const config = typeConfig[transaction.type] || typeConfig.expense;
  const isTransfer = transaction.type === 'transfer';
  const isRecurring = Boolean(
    transaction.source_type === 'recurring' ||
      transaction.recurring_transaction_id ||
      transaction.recurring_posted_for_date
  );
  const isGoalContribution = Boolean(
    transaction.source_type === 'goal' ||
      transaction.source_type === 'savings_goal' ||
      transaction.savings_goal_id ||
      transaction.goal_contribution_id
  );

  const accountName = account?.name || 'Account';
  const transactionTypeLabel = formatTransactionType(transaction.type);
  const transferTypeLabel = getTransferType(account, toAccount);

  const title = isGoalContribution
    ? category?.name || 'Goal contribution'
    : isTransfer
      ? [account?.name, toAccount?.name].filter(Boolean).join(' → ')
      : category?.name || 'Uncategorized';

  const transferCategoryName =
  category?.name || transferTypeLabel || 'Transfer';

  const primarySubtitle = isGoalContribution
    ? `Goal contribution - ${accountName}`
    : isTransfer
      ? `Transfer - ${transferCategoryName}`
      : `${transactionTypeLabel} - ${accountName}`;

  const secondarySubtitle = !isTransfer || isGoalContribution ? transaction.note : null;
  const amountValue = Math.abs(Number(transaction.amount || 0));

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 min-h-[64px] hover:bg-accent/50 transition-colors cursor-pointer"
    >
      {isTransfer ? (
        <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-primary/10 text-primary shrink-0">
          <ArrowLeftRight className="h-4 w-4 stroke-[2.2]" />
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

        {primarySubtitle && (
          <div className="text-xs text-muted-foreground truncate">
            {primarySubtitle}
          </div>
        )}

        {secondarySubtitle && (
          <div className="text-xs text-muted-foreground/80 truncate">
            {secondarySubtitle}
          </div>
        )}

        {(isRecurring || isGoalContribution) && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {isRecurring && (
              <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold leading-none text-primary">
                Recurring
              </span>
            )}

            {isGoalContribution && (
              <span className="inline-flex items-center rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold leading-none text-emerald-700 dark:text-emerald-400">
                Goal
              </span>
            )}
          </div>
        )}
      </div>

      <div className="text-right shrink-0">
        <div
          className={cn(
            'text-sm font-semibold tabular-nums inline-flex items-center gap-1 whitespace-nowrap',
            config.color
          )}
        >
          {config.sign && <span>{config.sign}</span>}

          <CurrencyAmount
            value={amountValue}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );
}