import { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { Input } from '@/components/ui/input';
import { GlassCard, MoneyAmount, TonePill } from '@/components/shared/Premium';

function Money({ amount, formatCurrency }) {
  if (formatCurrency) {
    return <MoneyAmount>{formatCurrency(amount)}</MoneyAmount>;
  }

  return (
    <MoneyAmount className="gap-1">
      <img src="/sar.svg" alt="SAR" className="h-3.5 w-3.5 dark:invert" />
      {Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </MoneyAmount>
  );
}

function getTone(type, isOver) {
  if (isOver) return 'debt';
  if (type === 'income') return 'income';
  if (type === 'savings') return 'savings';
  if (type === 'debt') return 'debt';
  return 'expense';
}

function getBarClass(type, isOver) {
  if (isOver) return 'bg-red-500';
  if (type === 'income') return 'bg-emerald-500';
  if (type === 'savings') return 'bg-teal-500';
  if (type === 'debt') return 'bg-red-500';
  return 'bg-blue-500';
}

function ReadRow({ category, spent, planned, isSubcategory, formatCurrency }) {
  const percentage = planned > 0 ? Math.min((spent / planned) * 100, 100) : 0;
  const remaining = planned - spent;
  const isOver = spent > planned && planned > 0;

  return (
    <div
      className={cn(
        'rounded-[1.1rem] px-3 py-3 transition-colors hover:bg-foreground/[0.04] dark:hover:bg-secondary/70',
        isSubcategory && 'ml-8'
      )}
    >
      <div className="flex items-center gap-3">
        {!isSubcategory ? (
          <CategoryIcon icon={category.icon} color={category.color} size="sm" className="rounded-2xl" />
        ) : (
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-border" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span
              className={cn(
                'truncate text-sm',
                isSubcategory ? 'text-muted-foreground' : 'font-semibold'
              )}
            >
              {category.name}
            </span>

            <span
              className={cn(
                'shrink-0 text-xs font-semibold tabular-nums',
                isOver ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'
              )}
            >
              {remaining >= 0 ? (
                <span className="inline-flex items-center gap-1">
                  <Money amount={remaining} formatCurrency={formatCurrency} />
                  left
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Money amount={Math.abs(remaining)} formatCurrency={formatCurrency} />
                  over
                </span>
              )}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn('h-full rounded-full transition-all duration-700', getBarClass(category.type, isOver))}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <Money amount={spent} formatCurrency={formatCurrency} />
            <span>actual of</span>
            <Money amount={planned} formatCurrency={formatCurrency} />
            <span>planned</span>
            {isOver && (
              <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-300">
                <AlertTriangle className="h-3 w-3" />
                over budget
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditRow({
  category,
  value,
  lastMonthHint,
  onChange,
  isSubcategory,
  formatCurrency,
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-foreground/[0.04] dark:hover:bg-secondary/70',
        isSubcategory && 'ml-8'
      )}
    >
      {!isSubcategory ? (
        <CategoryIcon icon={category.icon} color={category.color} size="sm" className="rounded-2xl" />
      ) : (
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-border" />
      )}

      <div className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-sm',
            isSubcategory ? 'text-muted-foreground' : 'font-semibold'
          )}
        >
          {category.name}
        </span>

        {lastMonthHint > 0 && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>Last</span>
            <Money amount={lastMonthHint} formatCurrency={formatCurrency} />
          </span>
        )}
      </div>

      <div className="w-32 shrink-0">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={value || ''}
          onChange={(event) => onChange(parseFloat(event.target.value) || 0)}
          placeholder="0.00"
          className="h-10 rounded-2xl bg-secondary/60 text-right text-sm font-semibold tabular-nums shadow-none"
          inputMode="decimal"
        />
      </div>
    </div>
  );
}

export default function UnifiedCategorySection({
  title,
  categories,
  subcategories,
  isEditMode,
  getCategorySpent,
  getCategoryPlanned,
  editValues,
  onEditChange,
  prevValues,
  formatCurrency,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedParents, setExpandedParents] = useState({});

  const toggleParent = (id) =>
    setExpandedParents((prev) => ({ ...prev, [id]: !prev[id] }));

  const parentCategories = categories.filter((category) => !category.parent_id);

  const totalSpent = parentCategories.reduce((sum, category) => {
    const subs = subcategories.filter((sub) => sub.parent_id === category.id);

    return (
      sum +
      (subs.length > 0
        ? subs.reduce((subSum, sub) => subSum + getCategorySpent(sub.id), 0)
        : getCategorySpent(category.id))
    );
  }, 0);

  const totalPlanned = isEditMode
    ? parentCategories.reduce((sum, category) => {
        const subs = subcategories.filter((sub) => sub.parent_id === category.id);

        if (subs.length > 0) {
          return sum + subs.reduce((subSum, sub) => subSum + (editValues[sub.id] || 0), 0);
        }

        return sum + (editValues[category.id] || 0);
      }, 0)
    : parentCategories.reduce((sum, category) => {
        const subs = subcategories.filter((sub) => sub.parent_id === category.id);

        return (
          sum +
          (subs.length > 0
            ? subs.reduce((subSum, sub) => subSum + getCategoryPlanned(sub.id), 0)
            : getCategoryPlanned(category.id))
        );
      }, 0);

  if (parentCategories.length === 0) return null;

  const sectionType = parentCategories[0]?.type || 'expense';
  const isOver = totalSpent > totalPlanned && totalPlanned > 0;
  const tone = getTone(sectionType, isOver);

  return (
    <GlassCard tone={tone} className="p-0">
      <button
        type="button"
        onClick={() => setIsCollapsed((value) => !value)}
        className="flex w-full items-center justify-between gap-3 border-b border-border/70 px-4 py-3 text-left sm:px-5"
      >
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {parentCategories.length} parent categor{parentCategories.length === 1 ? 'y' : 'ies'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <TonePill tone={tone} className="hidden sm:inline-flex">
            {isEditMode ? (
              <Money amount={totalPlanned} formatCurrency={formatCurrency} />
            ) : (
              <>
                <Money amount={totalSpent} formatCurrency={formatCurrency} />
                <span>/</span>
                <Money amount={totalPlanned} formatCurrency={formatCurrency} />
              </>
            )}
          </TonePill>

          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              isCollapsed && 'rotate-180'
            )}
          />
        </div>
      </button>

      {!isCollapsed && (
        <div className="space-y-1 p-2">
          {parentCategories.map((category) => {
            const subs = subcategories.filter((sub) => sub.parent_id === category.id);
            const isParentOpen = expandedParents[category.id] !== false;

            const catSpent =
              subs.length > 0
                ? subs.reduce((sum, sub) => sum + getCategorySpent(sub.id), 0)
                : getCategorySpent(category.id);

            const catPlanned = isEditMode
              ? subs.length > 0
                ? subs.reduce((sum, sub) => sum + (editValues[sub.id] || 0), 0)
                : editValues[category.id] || 0
              : subs.length > 0
                ? subs.reduce((sum, sub) => sum + getCategoryPlanned(sub.id), 0)
                : getCategoryPlanned(category.id);

            return (
              <div key={category.id}>
                {subs.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggleParent(category.id)}
                    className="w-full rounded-2xl text-left transition-colors hover:bg-foreground/[0.04] dark:hover:bg-secondary/70"
                  >
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        {isEditMode ? (
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <CategoryIcon icon={category.icon} color={category.color} size="sm" className="rounded-2xl" />
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                              {category.name}
                            </span>
                            <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                              <Money amount={catPlanned} formatCurrency={formatCurrency} />
                            </span>
                          </div>
                        ) : (
                          <ReadRow
                            category={category}
                            spent={catSpent}
                            planned={catPlanned}
                            formatCurrency={formatCurrency}
                          />
                        )}
                      </div>

                      <ChevronDown
                        className={cn(
                          'mr-3 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                          isParentOpen && 'rotate-180'
                        )}
                      />
                    </div>
                  </button>
                ) : isEditMode ? (
                  <EditRow
                    category={category}
                    value={editValues[category.id]}
                    lastMonthHint={prevValues[category.id] || 0}
                    onChange={(value) => onEditChange(category.id, value)}
                    formatCurrency={formatCurrency}
                  />
                ) : (
                  <ReadRow
                    category={category}
                    spent={catSpent}
                    planned={catPlanned}
                    formatCurrency={formatCurrency}
                  />
                )}

                {subs.length > 0 &&
                  isParentOpen &&
                  subs.map((sub) =>
                    isEditMode ? (
                      <EditRow
                        key={sub.id}
                        category={sub}
                        value={editValues[sub.id]}
                        lastMonthHint={prevValues[sub.id] || 0}
                        onChange={(value) => onEditChange(sub.id, value)}
                        isSubcategory
                        formatCurrency={formatCurrency}
                      />
                    ) : (
                      <ReadRow
                        key={sub.id}
                        category={sub}
                        spent={getCategorySpent(sub.id)}
                        planned={getCategoryPlanned(sub.id)}
                        isSubcategory
                        formatCurrency={formatCurrency}
                      />
                    )
                  )}
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
