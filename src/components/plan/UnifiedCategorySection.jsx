import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { Input } from '@/components/ui/input';

function Money({ amount, formatCurrency }) {
  if (formatCurrency) {
    return <>{formatCurrency(amount)}</>;
  }

  return (
    <span className="inline-flex items-center gap-1">
      <img
      src="/sar.svg"
      alt="SAR"
      className="w-3.5 h-3.5 dark:invert"
      />
      {Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}

// Read mode row
function ReadRow({ category, spent, planned, isSubcategory, formatCurrency }) {
  const percentage = planned > 0 ? Math.min((spent / planned) * 100, 100) : 0;
  const remaining = planned - spent;
  const isOver = spent > planned && planned > 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-3 px-4 hover:bg-accent/40 transition-colors cursor-pointer',
        isSubcategory && 'pl-14'
      )}
    >
      {!isSubcategory ? (
        <CategoryIcon icon={category.icon} color={category.color} size="sm" />
      ) : (
        <div className="w-2 h-2 rounded-full bg-border shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={cn(
              'text-sm truncate',
              isSubcategory ? 'text-muted-foreground' : 'font-medium'
            )}
          >
            {category.name}
          </span>

          <span
            className={cn(
              'text-sm font-medium tabular-nums shrink-0 ml-2 inline-flex items-center gap-1',
              isOver ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            <Money
              amount={remaining >= 0 ? remaining : Math.abs(remaining)}
              formatCurrency={formatCurrency}
            />
            <span>{remaining >= 0 ? 'left' : 'over'}</span>
          </span>
        </div>

        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isOver
                ? 'bg-destructive'
                : category.type === 'income'
                  ? 'bg-[hsl(var(--success))]'
                  : 'bg-primary'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Edit mode row
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
        'flex items-center gap-3 py-2.5 px-4',
        isSubcategory && 'pl-14'
      )}
    >
      {!isSubcategory ? (
        <CategoryIcon icon={category.icon} color={category.color} size="sm" />
      ) : (
        <div className="w-2 h-2 rounded-full bg-border shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm truncate block',
            isSubcategory ? 'text-muted-foreground' : 'font-medium'
          )}
        >
          {category.name}
        </span>

        {lastMonthHint > 0 && (
          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <span>Last:</span>
            <Money amount={lastMonthHint} formatCurrency={formatCurrency} />
          </span>
        )}
      </div>

      <div className="w-28 shrink-0">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          className="h-8 text-right text-sm tabular-nums font-medium"
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

  const parentCategories = categories.filter((c) => !c.parent_id);
  const sectionType = parentCategories[0]?.type || title.toLowerCase();
  const sectionStyles = {
    income: {
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-500/5 dark:bg-emerald-400/5',
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
    },
    expense: {
      text: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-500/5 dark:bg-red-400/5',
      iconBg: 'bg-red-500/10 dark:bg-red-400/10',
    },
    savings: {
      text: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-500/5 dark:bg-blue-400/5',
      iconBg: 'bg-blue-500/10 dark:bg-blue-400/10',
    },
    debt: {
      text: 'text-purple-700 dark:text-purple-400',
      bg: 'bg-purple-500/5 dark:bg-purple-400/5',
      iconBg: 'bg-purple-500/10 dark:bg-purple-400/10',
    },
  };
  const sectionStyle = sectionStyles[sectionType] || sectionStyles.expense;

  const totalSpent = parentCategories.reduce((sum, c) => {
    const subs = subcategories.filter((s) => s.parent_id === c.id);

    return (
      sum +
      (subs.length > 0
        ? subs.reduce((s, sub) => s + getCategorySpent(sub.id), 0)
        : getCategorySpent(c.id))
    );
  }, 0);

  const totalPlanned = isEditMode
    ? parentCategories.reduce((sum, c) => {
        const subs = subcategories.filter((s) => s.parent_id === c.id);

        if (subs.length > 0) {
          return sum + subs.reduce((s, sub) => s + (editValues[sub.id] || 0), 0);
        }

        return sum + (editValues[c.id] || 0);
      }, 0)
    : parentCategories.reduce((sum, c) => {
        const subs = subcategories.filter((s) => s.parent_id === c.id);

        return (
          sum +
          (subs.length > 0
            ? subs.reduce((s, sub) => s + getCategoryPlanned(sub.id), 0)
            : getCategoryPlanned(c.id))
        );
      }, 0);

  if (parentCategories.length === 0) return null;

  return (
    <div className="surface-card card-elevated overflow-hidden rounded-xl border border-white/40 transition-all duration-200 dark:border-white/[0.05]">
      <button
        type="button"
        onClick={() => setIsCollapsed((p) => !p)}
        className={cn(
          'flex w-full items-center justify-between gap-3 border-b border-border/40 px-5 py-3.5 text-left transition-colors hover:bg-white/20 dark:hover:bg-white/[0.03]',
          sectionStyle.bg
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
              sectionStyle.iconBg,
              sectionStyle.text
            )}
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isCollapsed && 'rotate-180'
              )}
            />
          </span>

          <h3
            className={cn(
              'truncate text-sm font-bold tracking-wide',
              sectionStyle.text
            )}
          >
            {title}
          </h3>
        </div>

        <div
          className={cn(
            'shrink-0 text-right text-sm font-black tracking-tight tabular-nums sm:text-base',
            sectionStyle.text
          )}
        >
          {isEditMode ? (
            <Money amount={totalPlanned} formatCurrency={formatCurrency} />
          ) : (
            <span className="inline-flex items-center gap-1">
              <Money amount={totalSpent} formatCurrency={formatCurrency} />
              <span className="opacity-50">/</span>
              <Money amount={totalPlanned} formatCurrency={formatCurrency} />
            </span>
          )}
        </div>
      </button>

      {!isCollapsed && (
        <div className="divide-y divide-border/50">
          {parentCategories.map((cat) => {
            const subs = subcategories.filter((s) => s.parent_id === cat.id);
            const isParentOpen = expandedParents[cat.id] !== false;

            const catSpent =
              subs.length > 0
                ? subs.reduce((s, sub) => s + getCategorySpent(sub.id), 0)
                : getCategorySpent(cat.id);

            const catPlanned = isEditMode
              ? subs.length > 0
                ? subs.reduce((s, sub) => s + (editValues[sub.id] || 0), 0)
                : editValues[cat.id] || 0
              : subs.length > 0
                ? subs.reduce((s, sub) => s + getCategoryPlanned(sub.id), 0)
                : getCategoryPlanned(cat.id);

            return (
              <div key={cat.id}>
                {subs.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggleParent(cat.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center">
                      <div className="flex-1">
                        {isEditMode ? (
                          <div className="flex items-center gap-3 py-2.5 px-4">
                            <CategoryIcon
                              icon={cat.icon}
                              color={cat.color}
                              size="sm"
                            />

                            <span className="flex-1 text-sm font-medium truncate">
                              {cat.name}
                            </span>

                            <span className="text-sm text-muted-foreground tabular-nums inline-flex items-center gap-1">
                              <Money
                                amount={catPlanned}
                                formatCurrency={formatCurrency}
                              />
                            </span>

                            <ChevronDown
                              className={cn(
                                'w-3.5 h-3.5 text-muted-foreground transition-transform',
                                isParentOpen && 'rotate-180'
                              )}
                            />
                          </div>
                        ) : (
                          <ReadRow
                            category={cat}
                            spent={catSpent}
                            planned={catPlanned}
                            formatCurrency={formatCurrency}
                          />
                        )}
                      </div>

                      {!isEditMode && (
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 mr-4 text-muted-foreground transition-transform',
                            isParentOpen && 'rotate-180'
                          )}
                        />
                      )}
                    </div>
                  </button>
                ) : isEditMode ? (
                  <EditRow
                    category={cat}
                    value={editValues[cat.id]}
                    lastMonthHint={prevValues[cat.id] || 0}
                    onChange={(v) => onEditChange(cat.id, v)}
                    formatCurrency={formatCurrency}
                  />
                ) : (
                  <ReadRow
                    category={cat}
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
                        onChange={(v) => onEditChange(sub.id, v)}
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
    </div>
  );
}