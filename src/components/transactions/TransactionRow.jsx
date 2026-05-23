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

function cleanGeneratedNote(note = '') {
  return String(note)
    .replace(/\s*·\s*Recurring\s*$/i, '')
    .replace(/^Contribution to\s+/i, '')
    .trim();
}

function getGoalName(transaction, category) {
  return (
    transaction.goal_name ||
    transaction.savings_goal_name ||
    transaction.goal?.name ||
    transaction.savings_goal?.name ||
    cleanGeneratedNote(transaction.note) ||
    category?.name ||
    'Goal'
  );
}

function SourceBadge({ type }) {
  if (!type) return null;

  const isGoal = type === 'goal';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold leading-none',
        isGoal
          ? 'border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'border-primary/15 bg-primary/10 text-primary'
      )}
    >
      {isGoal ? 'Goal' : 'Recurring'}
    </span>
  );
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
  const transferTitle = [accountName, toAccount?.name].filter(Boolean).join(' → ');
  const transferCategoryName = isGoalContribution
    ? getGoalName(transaction, category)
    : category?.name || cleanGeneratedNote(transaction.note) || transferTypeLabel || 'Transfer';

  const title = isTransfer
    ? transferTitle || 'Transfer'
    : category?.name || cleanGeneratedNote(transaction.note) || 'Uncategorized';

  const primarySubtitle = isTransfer
    ? `Transfer - ${transferCategoryName}`
    : `${transactionTypeLabel} - ${accountName}`;

  const sourceBadgeType = isGoalContribution ? 'goal' : isRecurring ? 'recurring' : null;
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

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="truncate text-sm font-medium">{title}</div>
          <SourceBadge type={sourceBadgeType} />
        </div>

        {primarySubtitle && (
          <div className="truncate text-xs text-muted-foreground">
            {primarySubtitle}
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

          <CurrencyAmount
            value={amountValue}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );
}
