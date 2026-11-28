import { getOutstandingOccurrence } from '@/components/transactions/scheduledUtils';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarClock,
  Clock3,
  ChevronRight,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import DashboardSectionCard, {
  DashboardGhostAction,
} from '@/components/dashboard/DashboardSectionCard';
import {
  formatRecurringDate,
  getRecurringFrequencyLabel,
  getRecurringStatus,
  todayIsoDate,
  sortRecurringByDueDate,
} from '@/lib/recurringTransactions';
import { cn } from '@/lib/utils';

function getTypeIcon(type) {
  if (type === 'income') return ArrowDownLeft;
  if (type === 'transfer') return ArrowLeftRight;
  return ArrowUpRight;
}

function getStatusClass(status) {
  if (status.key === 'overdue') {
    return 'border-destructive/20 bg-destructive/10 text-destructive';
  }

  if (status.key === 'due_today') {
    return 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400';
  }

  if (status.key === 'paused') {
    return 'border-border bg-secondary text-muted-foreground';
  }

  return 'border-primary/20 bg-primary/10 text-primary';
}

function RuleAmount({ rule, amount, formatCurrency }) {
  const displayAmount = Math.abs(Number(amount ?? rule.amount ?? 0));

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 whitespace-nowrap text-sm font-medium tabular-nums',
        rule.type === 'income'
          ? 'text-[hsl(var(--success))]'
          : rule.type === 'expense'
            ? 'text-destructive'
            : 'text-primary'
      )}
    >
      {rule.type === 'income' ? '+' : rule.type === 'expense' ? '-' : ''}
      {formatCurrency(displayAmount)}
    </span>
  );
}

export default function UpcomingBillsPreview({
  recurringTransactions = [],
  accounts = [],
  categories = [],
  transactions = [],
  currentMonth,
  formatCurrency,
  limit = 3,
  className,
}) {
  const previewRules = sortRecurringByDueDate(recurringTransactions)
    .filter(rule => rule.is_active !== false && !rule.completed_at && !rule.is_archived)
    .map(rule => {
      const occurrence = getOutstandingOccurrence(rule, transactions);
      const flexible = rule.payment_mode === 'flexible' || rule.type === 'income';
      const pending = flexible ? occurrence.remaining > 0.005 : !occurrence.hasPosting;
      return { rule, occurrence, pending };
    })
    .filter(({ rule, pending }) => {
      const days = getRecurringStatus(rule, todayIsoDate()).daysUntilDue;
      return pending && days !== null && days <= 7;
    })
    .slice(0, limit);

  return (
    <DashboardSectionCard
      title="Upcoming"
      icon={CalendarClock}
      className={className}
      action={
        <DashboardGhostAction className="min-h-9 h-9 gap-1 rounded-none border-0 bg-transparent pl-2 pr-0 text-xs font-medium shadow-none">
          <Link to="/transactions?tab=scheduled">
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </DashboardGhostAction>
      }
    >
      {previewRules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 app-card-surface-soft px-4 py-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Clock3 className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">Nothing due in the next 7 days</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            Unpaid bills and income due within 7 days appear here. Overdue items remain visible.
          </p>
        </div>
      ) : (
        <div className="min-w-0 divide-y divide-border/50">
          {previewRules.map(({ rule, occurrence }) => {
            const status = getRecurringStatus(rule);
            const Icon = getTypeIcon(rule.type);
            const category = categories.find((item) => item.id === rule.category_id);
            const account = accounts.find((item) => item.id === rule.account_id);
            const toAccount = accounts.find((item) => item.id === rule.to_account_id);

            return (
              <div
                key={rule.id}
                className="min-w-0 flex items-center min-h-[48px] py-2"
              >
                <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3">
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-xl sm:h-9 sm:w-9 sm:rounded-2xl',
                      rule.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : rule.type === 'expense'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <p className="min-w-0 truncate text-sm font-medium text-foreground">
                        {rule.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'shrink-0 rounded-full px-1.5 py-0 text-[9px] font-bold leading-4 sm:px-2 sm:text-[10px]',
                          getStatusClass(status)
                        )}
                      >
                        {status.label}
                      </Badge>
                    </div>

                    <p className="truncate text-xs leading-4 text-muted-foreground sm:text-xs">
                      {occurrence.paid > 0 && occurrence.remaining > 0.005
                        ? (rule.type === 'income' ? 'Partially received' : 'Partially paid') + ' · '
                        : ''}Due {formatRecurringDate(rule.next_due_date)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <RuleAmount rule={rule} amount={rule.type === 'income' || rule.payment_mode === 'flexible' ? occurrence.remaining : undefined} formatCurrency={formatCurrency} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardSectionCard>
  );
}
