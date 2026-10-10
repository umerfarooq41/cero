import { ArrowLeftRight } from 'lucide-react';
import CategoryIcon from '@/components/shared/CategoryIcon';
import SourceBadge from '@/components/shared/SourceBadge';
import { cn } from '@/lib/utils';
import { formatCurrencyNumberText } from '@/lib/currencies';

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
        {formatCurrencyNumberText(Math.abs(value || 0))}
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

function cleanGeneratedNote(note) {
  if (note == null) return '';

  return String(note)
    .replace(/\s*·\s*Recurring\s*$/i, '')
    .replace(/^Contribution to\s+/i, '')
    .replace(/^Use\s+/i, '')
    .replace(/\s+funds$/i, '')
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

export default function TransactionRow({
  transaction,
  category,
  account,
  toAccount,
  recurringRule,
  goal,
  formatCurrency,
  onClick,
  compactSourceBadges = false,
  flush = false,
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
      color: 'text-sky-600 dark:text-sky-400',
      sign: '',
    },
  };

  const isAdjustment = transaction.source_type === 'adjustment' ||
    /^(Account balance adjustment|Debt principal removed:)/i.test(transaction.note || '');
  const isDebtRemoval = isAdjustment && /^Debt principal removed:/i.test(transaction.note || '');
  const config = isAdjustment
    ? { color: 'text-muted-foreground', sign: isDebtRemoval ? '−' : transaction.type === 'income' ? '+' : '−' }
    : typeConfig[transaction.type] || typeConfig.expense;
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

  const accountName = account?.name || transaction.account_name_snapshot || 'Account';
  const destinationName = toAccount?.name || transaction.to_account_name_snapshot || '';
  const transactionTypeLabel = formatTransactionType(transaction.type);
  const transferTitle = [accountName, destinationName].filter(Boolean).join(' → ');

  const noteLabel = cleanGeneratedNote(transaction.note);

  const goalName = goal?.name || getGoalName(transaction, category);
  const recurringName = recurringRule?.name || noteLabel || category?.name;
  const sourceName = isGoalContribution
    ? goalName
    : isRecurring
      ? recurringName
      : null;

  const title = isAdjustment ? (noteLabel || 'Balance adjustment') : isTransfer
    ? sourceName || transferTitle || 'Transfer'
    : sourceName || category?.name || noteLabel || 'Uncategorized';

  const movementLabel = [accountName, destinationName].filter(Boolean).join(' → ');
  const transferKindLabel = isGoalContribution
    ? 'Goal contribution'
    : isRecurring && getTransferType(account, toAccount) === 'Debt'
      ? 'Debt payment'
      : 'Transfer';

  const primarySubtitle = isAdjustment
    ? `${isDebtRemoval ? 'Debt adjustment' : 'Balance adjustment'} - ${accountName}${isDebtRemoval ? ' · owed' : ''}`
    : isTransfer
    ? [movementLabel, transferKindLabel].filter(Boolean).join(' · ')
    : `${transactionTypeLabel} - ${accountName}`;

  const sourceBadgeType = isGoalContribution ? 'goal' : isRecurring ? 'recurring' : null;

  const sourceBadgeTone = (() => {
    if (!sourceBadgeType) return null;

    if (isTransfer) {
      const transferKind = getTransferType(account, toAccount).toLowerCase();

      if (transferKind === 'saving') return 'savings';
      if (transferKind === 'debt') return 'debt';

      return 'transfer';
    }

    return category?.budget_type || category?.type || transaction.type;
  })();

  const amountValue = Math.abs(Number(transaction.amount || 0));

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex min-w-0 items-center gap-2 py-2.5 min-h-[56px] hover:bg-accent/50 transition-colors cursor-pointer sm:gap-3 sm:py-3 sm:min-h-[64px]',
        flush ? 'px-0' : 'px-2.5 sm:px-3'
      )}
    >
      {isTransfer ? (
        <div className="h-7 w-7 rounded-xl flex items-center justify-center bg-sky-500/10 text-sky-600 shrink-0 dark:text-sky-400 sm:h-8 sm:w-8">
          <ArrowLeftRight className="h-3.5 w-3.5 stroke-[2.2] sm:h-4 sm:w-4" />
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
          <div className="truncate text-xs font-semibold sm:text-sm sm:font-medium">
            {title}
          </div>

          <SourceBadge
            type={sourceBadgeType}
            tone={sourceBadgeTone}
            compact={compactSourceBadges}
          />
        </div>

        {primarySubtitle && (
          <div
            className="line-clamp-2 break-words pr-1 text-[11px] leading-4 text-muted-foreground sm:text-xs sm:leading-4"
            title={primarySubtitle}
          >
            {primarySubtitle}
          </div>
        )}
      </div>

      <div className="shrink-0 text-right">
        <div
          className={cn(
            'inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-semibold tabular-nums sm:gap-1 sm:text-sm',
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