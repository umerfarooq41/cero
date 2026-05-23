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

function RuleAmount({ rule, formatCurrency }) {
  const amount = Math.abs(Number(rule.amount || 0));

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap text-sm font-bold tabular-nums',
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
  formatCurrency,
  limit = 3,
  className,
}) {
  const previewRules = sortRecurringByDueDate(recurringTransactions)
    .filter((rule) => rule.is_active !== false)
    .slice(0, limit);

  return (
    <section
      className={cn(
        'rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-xl md:p-5',
        className
      )}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarClock className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground md:text-base">
                Upcoming bills
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Compact preview of important recurring items.
              </p>
            </div>
          </div>
        </div>

        <Button asChild variant="ghost" size="sm" className="w-fit shrink-0 gap-1 text-xs">
          <Link to="/transactions?tab=scheduled">
            View Scheduled
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
                className="min-w-0 rounded-2xl border border-border/60 bg-background/35 p-3"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl',
                      rule.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : rule.type === 'expense'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-foreground">{rule.name}</p>
                      <Badge
                        variant="outline"
                        className={cn('rounded-full px-2 py-0 text-[10px]', getStatusClass(status))}
                      >
                        {status.label}
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {getRecurringFrequencyLabel(rule.frequency)} · Due {formatRecurringDate(rule.next_due_date)}
                    </p>

                    <p className="text-xs leading-5 text-muted-foreground/85">
                      {rule.type === 'transfer'
                        ? `${account?.name || 'Account'} → ${toAccount?.name || 'Account'}`
                        : `${category?.name || 'Uncategorized'} · ${account?.name || 'Account'}`}
                    </p>

                    <div className="mt-2 min-[421px]:hidden">
                      <RuleAmount rule={rule} formatCurrency={formatCurrency} />
                    </div>
                  </div>

                  <div className="shrink-0 text-right max-[420px]:hidden">
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
