import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Archive, ArchiveRestore, ArrowUpRight, ChevronDown, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatRecurringDate, getRecurringFrequencyLabel, getRecurringStatus } from '@/lib/recurringTransactions';
import { cn } from '@/lib/utils';
import { COLORS, TYPE_ACCENT, TYPE_ICONS, TYPE_LABELS, normalizeRuleType } from './recurringPanelHelpers';

export function RecurringActionSheet({ rule, open, onClose, onEdit, onArchive, onDelete }) {
  if (!rule) return null;
  const isDebtRule = normalizeRuleType(rule.type) === 'transfer';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <CategoryIcon icon={rule.icon || 'receipt'} color={rule.color || COLORS[0]} size="md" />
            <div className="min-w-0">
              <DialogTitle className="truncate text-base">{rule.name}</DialogTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isDebtRule ? 'Debt' : `${TYPE_LABELS[normalizeRuleType(rule.type)] || 'Expense'} recurring rule`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-1 py-1">
          <button
            type="button"
            onClick={() => {
              onEdit(rule);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{isDebtRule ? 'Edit Debt' : 'Edit Rule'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onArchive(rule);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
          >
            {rule.is_archived ? (
              <ArchiveRestore className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Archive className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {rule.is_archived ? (isDebtRule ? 'Unarchive Debt' : 'Unarchive') : (isDebtRule ? 'Archive Debt' : 'Archive Rule')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onDelete(rule);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">{isDebtRule ? 'Delete Debt' : 'Delete Rule'}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RecurringRow({ rule, account, category, onAction, formatCurrency, paidAmount = 0, postedOccurrences = 0 }) {
  const status = getRecurringStatus(rule);
  const fallbackIcon = normalizeRuleType(rule.type) === 'income' ? 'income' : normalizeRuleType(rule.type) === 'transfer' ? 'loan' : 'receipt';
  const amount = Math.abs(Number(rule.amount || 0));
  const type = normalizeRuleType(rule.type);
  const isDebt = type === 'transfer';
  const isFixedDebt = isDebt && (rule.payment_mode || 'fixed') === 'fixed';
  const debtTotal = Math.max(0, Number(rule.total_amount || 0));
  const debtMeta = isFixedDebt && rule.duration_count
    ? `${Math.min(Number(rule.duration_count), postedOccurrences)} of ${rule.duration_count} paid`
    : isDebt && debtTotal > 0
      ? `${formatCurrency(Math.min(paidAmount, debtTotal))} / ${formatCurrency(debtTotal)} paid`
      : null;

  return (
    <div className="group flex items-stretch gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40 lg:items-center lg:py-3">
      <div className="shrink-0 self-start">
        <CategoryIcon
          icon={rule.icon || category?.icon || fallbackIcon}
          color={rule.color || category?.color || COLORS[0]}
          size="sm"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="min-w-0 truncate text-sm font-semibold lg:text-base leading-tight">
          {rule.name}
        </div>

        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
          {getRecurringFrequencyLabel(rule.frequency)} · {status.label}
        </p>

        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {debtMeta || account?.name || 'Account'}
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-end text-right text-sm font-medium lg:min-w-32 tabular-nums text-foreground">
        {formatCurrency(amount)}
      </div>

      <div className="-ml-2 flex w-6 shrink-0 items-center justify-end">
        <button
          type="button"
          onClick={() => onAction(rule)}
          className="-mr-2 rounded-md p-1.5 text-muted-foreground opacity-100 transition-all hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 lg:opacity-100"
          aria-label={`Open actions for ${rule.name}`}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function RecurringSection({ type, label, rules, accounts, categories, defaultExpanded = false, onAddNew, onAction, formatCurrency, recurringPaidByRule, verifiedOccurrencesByRule }) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const Icon = TYPE_ICONS[type] || ArrowUpRight;

  return (
    <div className="overflow-hidden rounded-2xl app-card-surface lg:!rounded-none lg:!border-0 lg:!bg-transparent lg:!shadow-none lg:!backdrop-blur-none">
      <div className="flex min-h-14 items-center justify-between gap-2 px-3 py-2.5">
        <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', !isOpen && '-rotate-90')} />
          <Icon className={cn('h-4 w-4 shrink-0', TYPE_ACCENT[type])} />
          <h3 className={cn('truncate text-sm font-semibold lg:text-base', TYPE_ACCENT[type])}>{label}</h3>
        </button>
        <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">{rules.length}</span>
        <button type="button" onClick={() => onAddNew(type)} aria-label={`Add ${label.toLowerCase()} rule`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-primary"><Plus className="h-4 w-4" /></button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {rules.length === 0 ? (
              <div className="border-t border-border/50 px-3 py-3 text-center">
                <p className="text-xs text-muted-foreground">No rules yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 border-t border-border/50 lg:border-t-0">
                {rules.map((rule) => (
                  <RecurringRow
                    key={rule.id}
                    rule={rule}
                    account={accounts.find((account) => account.id === rule.account_id)}
                    category={categories.find((category) => category.id === rule.category_id)}
                    onAction={onAction}
                    formatCurrency={formatCurrency}
                    paidAmount={Math.max(0, Number(recurringPaidByRule?.[rule.id] || 0))}
                    postedOccurrences={Math.max(0, Number(verifiedOccurrencesByRule?.[rule.id] || 0))}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CompletedDebtsSection({ rules, accounts, categories, formatCurrency, onAction }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl app-card-surface lg:!rounded-none lg:!border-0 lg:!bg-transparent lg:!shadow-none lg:!backdrop-blur-none">
      <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((value) => !value)} className="flex min-h-14 w-full items-center justify-between gap-2 px-3 py-2.5 text-left">
        <span className="flex min-w-0 items-center gap-2.5">
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', !isOpen && '-rotate-90')} />
          <span className="truncate text-sm font-semibold lg:text-base text-green-700 dark:text-green-400">Completed Debts</span>
        </span>
        <span className="flex shrink-0 items-center gap-2"><span className="inline-flex min-w-7 items-center justify-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">{rules.length}</span><span aria-hidden="true" className="h-8 w-8" /></span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="divide-y divide-border/50 border-t border-border/50 lg:border-t-0">
              {rules.map((rule) => {
                const liability = accounts.find((account) => account.id === rule.to_account_id);
                const category = categories.find((item) => item.id === rule.category_id);
                return (
                  <div key={rule.id} className="group flex items-stretch gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40 lg:items-center lg:py-3">
                    <div className="shrink-0 self-start">
                      <CategoryIcon icon={rule.icon || category?.icon || 'loan'} color={rule.color || category?.color || COLORS[0]} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold lg:text-base">{rule.name}</div>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        Paid off{rule.completed_at ? ` · ${formatRecurringDate(rule.completed_at)}` : ''}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {formatCurrency(Math.abs(Number(rule.total_amount || 0)))}
                        {liability ? ` · ${liability.name}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center justify-end text-right text-sm font-medium lg:min-w-32 text-green-700 dark:text-green-400">
                      Completed
                    </div>
                    <div className="-ml-2 flex w-6 shrink-0 items-center justify-end">
                      <button
                        type="button"
                        onClick={() => onAction(rule)}
                        className="-mr-2 rounded-md p-1.5 text-muted-foreground opacity-100 transition-all hover:bg-accent hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 lg:opacity-100"
                        aria-label={`Open actions for ${rule.name}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

