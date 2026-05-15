import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import PlanCategoryRow from './PlanCategoryRow';

const fallbackFormatCurrency = (amount) =>
  Math.abs(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PlanCategoryGroup({
  title,
  categories,
  subcategories,
  getCategorySpent,
  getCategoryPlanned,
  formatCurrency,
}) {
  const [expanded, setExpanded] = useState({});
  const money = formatCurrency || fallbackFormatCurrency;

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const parentCategories = categories.filter(c => !c.parent_id);

  const totalSpent = parentCategories.reduce((sum, c) => {
    const subs = subcategories.filter(s => s.parent_id === c.id);
    if (subs.length > 0) {
      return sum + subs.reduce((s, sub) => s + getCategorySpent(sub.id), 0);
    }
    return sum + getCategorySpent(c.id);
  }, 0);

  const totalPlanned = parentCategories.reduce((sum, c) => {
    const subs = subcategories.filter(s => s.parent_id === c.id);
    if (subs.length > 0) {
      return sum + subs.reduce((s, sub) => s + getCategoryPlanned(sub.id), 0);
    }
    return sum + getCategoryPlanned(c.id);
  }, 0);

  if (parentCategories.length === 0) return null;

  return (
    <div className="surface-card card-elevated rounded-xl border border-white/40 dark:border-white/[0.05] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>

        <div className="text-xs text-muted-foreground tabular-nums inline-flex items-center gap-1">
          {money(totalSpent)}
          <span>/</span>
          {money(totalPlanned)}
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {parentCategories.map(cat => {
          const subs = subcategories.filter(s => s.parent_id === cat.id);
          const isOpen = expanded[cat.id];

          const catSpent = subs.length > 0
            ? subs.reduce((s, sub) => s + getCategorySpent(sub.id), 0)
            : getCategorySpent(cat.id);

          const catPlanned = subs.length > 0
            ? subs.reduce((s, sub) => s + getCategoryPlanned(sub.id), 0)
            : getCategoryPlanned(cat.id);

          return (
            <div key={cat.id}>
              <button
                onClick={() => subs.length > 0 && toggle(cat.id)}
                className="w-full text-left hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex-1">
                    <PlanCategoryRow
                      category={cat}
                      spent={catSpent}
                      planned={catPlanned}
                      formatCurrency={money}
                    />
                  </div>

                  {subs.length > 0 && (
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 mr-4 text-muted-foreground transition-transform',
                        isOpen && 'rotate-180'
                      )}
                    />
                  )}
                </div>
              </button>

              {isOpen && subs.map(sub => (
                <PlanCategoryRow
                  key={sub.id}
                  category={sub}
                  spent={getCategorySpent(sub.id)}
                  planned={getCategoryPlanned(sub.id)}
                  isSubcategory
                  formatCurrency={money}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}