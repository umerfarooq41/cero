import { LockKeyhole } from 'lucide-react';
import { toast } from 'sonner';
import CategoryIcon from '@/components/shared/CategoryIcon';
import SourceBadge from '@/components/shared/SourceBadge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatMoneyText, isProtectedPlanRow } from './monthlyPlanHelpers';

export default function PlanAmountRow({
  row,
  value,
  lastMonthHint,
  onChange,
  formatCurrency,
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-accent/30 lg:grid lg:grid-cols-[2rem_minmax(0,1fr)_minmax(7rem,0.5fr)_minmax(8rem,0.5fr)] lg:gap-3 lg:min-h-12',
        row.isSubcategory && 'pl-14 lg:pl-3'
      )}
    >
      {!row.isSubcategory && (
        <CategoryIcon icon={row.icon} color={row.color} size="sm" />
      )}

      {row.isSubcategory && (
        <div
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            backgroundColor:
              row.parentColor || row.color || 'hsl(var(--border))',
          }}
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'block truncate text-sm',
              row.isSubcategory
                ? 'text-muted-foreground'
                : 'font-medium text-foreground'
            )}
          >
            {row.name}
          </span>

          <SourceBadge
            type={row.sourceType}
            tone={row.sourceType === 'goal' ? 'savings' : row.type}
          />
        </div>

        {(row.description || lastMonthHint > 0) && (
          <div className="mt-0.5 flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap text-[10px] leading-3.5 text-muted-foreground">
            {row.description && (
              <span className="min-w-0 truncate">{row.description}</span>
            )}

            {lastMonthHint > 0 && (
              <span className="min-w-0 truncate tabular-nums lg:hidden">
                Last month: {formatCurrency(lastMonthHint)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="hidden text-right text-sm text-muted-foreground tabular-nums lg:block">{lastMonthHint > 0 ? formatCurrency(lastMonthHint) : "—"}</div>
      <div className="w-[84px] shrink-0 lg:w-full">
        {isProtectedPlanRow(row) ? (
          <button
            type="button"
            aria-label={`${row.name} is managed in the ${row.sourceType === 'goal' ? 'Goals' : 'Recurring'} tab`}
            onClick={() => toast.info(`Edit in ${row.sourceType === 'goal' ? 'Goals' : 'Recurring'} tab`)}
            className="flex h-8 w-full items-center justify-end gap-1 rounded-lg border border-border/40 bg-muted/25 px-2 text-sm font-medium tabular-nums text-muted-foreground transition-colors hover:bg-muted/45"
          >
            <LockKeyhole className="h-3 w-3 shrink-0 opacity-60" />
            <span className="truncate">{formatMoneyText(value || 0)}</span>
          </button>
        ) : row.isGenerated ? (
          <div className="h-8 rounded-lg border border-border/40 bg-muted/25 px-2 text-right text-sm font-medium leading-8 tabular-nums text-muted-foreground">
            {formatMoneyText(value || 0)}
          </div>
        ) : (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={value || ''}
            onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
            placeholder="0.00"
            aria-label={`${row.name} allocation`} className="h-8 rounded-lg px-2 text-right text-sm tabular-nums lg:h-9 lg:rounded-md"
          />
        )}
      </div>
    </div>
  );
}

