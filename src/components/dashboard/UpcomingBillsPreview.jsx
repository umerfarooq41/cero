import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Clock3,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  formatRecurringDate,
  getRecurringFrequencyLabel,
  getRecurringStatus,
  sortRecurringByDueDate,
} from '@/lib/recurringTransactions';
import { cn } from '@/lib/utils';

function getMonthKey(value) {
  return String(value || '').slice(0, 7);
}

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

function isRuleAlreadyPostedForDueMonth(rule, transactions = []) {
  const dueMonth = getMonthKey(rule.next_due_date);
  const ruleAmount = Math.abs(Number(rule.amount || 0));
  const ruleName = String(rule.name || '').trim().toLowerCase();

  return transactions.some((transaction) => {
    const transactionMonth = getMonthKey(transaction.date);
    const transactionAmount = Math.abs(Number(transaction.amount || 0));
    const note = String(transaction.note || '').toLowerCase();

    if (dueMonth && transactionMonth && dueMonth !== transactionMonth) return false;

    if (transaction.recurring_transaction_id && transaction.recurring_transaction_id === rule.id) {
      return true;
    }

    if (
      transaction.recurring_posted_for_date &&
      getMonthKey(transaction.recurring_posted_for_date) === dueMonth &&
      (transaction.recurring_transaction_id === rule.id || note.includes(ruleName))
    ) {
      return true;
    }

    const likelySameRule =
      transaction.type === rule.type &&
      transaction.account_id === rule.account_id &&
      (rule.type === 'transfer' ? transaction.to_account_id === rule.to_account_id : true) &&
      (rule.category_id ? transaction.category_id === rule.category_id : true) &&
      Math.abs(transactionAmount - ruleAmount) < 0.01 &&
      (transaction.source_type === 'recurring' || note.includes('recurring') || note.includes(ruleName));

    return likelySameRule;
  });
}

function RuleAmount({ rule, formatCurrency }) {
  const amount = Math.abs(Number(rule.amount || 0));

  return (
    <span
      className={cn(
        'inline-flex max-w-[112px] items-center justify-end gap-0.5 overflow-hidden whitespace-nowrap text-[12px] font-bold tabular-nums sm:max-w-none sm:gap-1 sm:text-sm',
        rule.type === 'income'
          ? 'text-[hsl(var(--success))]'
          : rule.type === 'expense'
            ? 'text-destructive'
            : 'text-primary'
      )}
    >
      {rule.type === 'income' ? '+' : rule.type === 'expense' ? '-' : ''}
      {formatCurrency(amount)}
    </span>
  );
}

export default function UpcomingBillsPreview({
  recurringTransactions = [],
  accounts = [],
  categories = [],
  transactions = [],
  formatCurrency,
  limit = 3,
  className,
}) {
  const previewRules = sortRecurringByDueDate(recurringTransactions)
    .filter((rule) => rule.is_active !== false)
    .filter((rule) => !isRuleAlreadyPostedForDueMonth(rule, transactions))
    .slice(0, limit);

  return (
    <section
      className={cn(
        'rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl md:p-5',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />

            <h2 className="min-w-0 truncate text-sm font-bold tracking-tight text-foreground md:text-base">
              Upcoming bills
            </h2>
          </div>

          <p className="mt-1 text-left text-xs leading-5 text-muted-foreground">
            Compact preview of important recurring items.
          </p>
        </div>

        <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1 px-2 text-xs">
          <Link to="/transactions?tab=scheduled">
            Scheduled
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {previewRules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-background/35 px-4 py-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
            <Clock3 className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">No upcoming items</p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            Add recurring rules in Manage Plan, then post them from Transactions → Scheduled.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {previewRules.map((rule) => {
            const status = getRecurringStatus(rule);
            const Icon = getTypeIcon(rule.type);
            const category = categories.find((item) => item.id === rule.category_id);
            const account = accounts.find((item) => item.id === rule.account_id);
            const toAccount = accounts.find((item) => item.id === rule.to_account_id);

            return (
              <div
                key={rule.id}
                className="rounded-2xl border border-border/60 bg-background/35 p-2.5 sm:p-3"
              >
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl sm:h-9 sm:w-9',
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
                      <p className="min-w-0 truncate text-[13px] font-bold text-foreground sm:text-sm">
                        {rule.name}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn('shrink-0 rounded-full px-1.5 py-0 text-[9px]', getStatusClass(status))}
                      >
                        {status.shortLabel || status.label}
                      </Badge>
                    </div>

                    <p className="mt-0.5 truncate text-[11px] leading-4 text-muted-foreground sm:text-xs sm:leading-5">
                      {getRecurringFrequencyLabel(rule.frequency)} · Due {formatRecurringDate(rule.next_due_date)}
                    </p>

                    <p className="truncate text-[11px] leading-4 text-muted-foreground/85 sm:text-xs sm:leading-5">
                      {rule.type === 'transfer'
                        ? `${account?.name || 'Account'} → ${toAccount?.name || 'Account'}`
                        : `${category?.name || 'Uncategorized'} · ${account?.name || 'Account'}`}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <RuleAmount rule={rule} formatCurrency={formatCurrency} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
