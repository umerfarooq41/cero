import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_ACCENT = {
  income: 'text-[hsl(var(--success))]',
  expense: 'text-primary',
  savings: 'text-chart-4',
  debt: 'text-destructive',
};

function CategoryRow({ cat, subs, onAction, onAddSub }) {
  const [subOpen, setSubOpen] = useState(false);
  const hasSubs = subs.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors group"
      >
        <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-tight">{cat.name}</div>
          {hasSubs && (
            <div className="text-[11px] text-muted-foreground">{subs.length} subcategor{subs.length > 1 ? 'ies' : 'y'}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddSub(cat)}
            className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title="Add subcategory"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAction(cat)}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {hasSubs && (
          <button
            onClick={() => setSubOpen(p => !p)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className={cn("w-4 h-4 transition-transform duration-200", subOpen && "rotate-90")} />
          </button>
        )}
      </div>

      {/* Subcategories */}
      <AnimatePresence initial={false}>
        {hasSubs && subOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {subs.map(sub => (
              <SubRow key={sub.id} sub={sub} onAction={onAction} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubRow({ sub, onAction }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 pl-[3.5rem] hover:bg-accent/30 transition-colors group border-t border-border/30">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sub.color || '#888' }} />
      <span className="text-sm text-muted-foreground flex-1 truncate">{sub.name}</span>
      <button
        onClick={() => onAction(sub)}
        className="p-1.5 rounded-md hover:bg-accent opacity-0 group-hover:opacity-100 text-muted-foreground transition-all"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function CategorySection({ type, label, categories, defaultExpanded = false, onAction, onAddSub, onAddNew }) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  const parents = categories.filter(c => c.type === type && !c.parent_id);
  const allSubs = categories.filter(c => c.parent_id);
  const totalCount = parents.length + parents.reduce((sum, p) => {
    return sum + allSubs.filter(s => s.parent_id === p.id).length;
  }, 0);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setIsOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            !isOpen && "-rotate-90"
          )} />
          <h3 className={cn("text-sm font-semibold", TYPE_ACCENT[type])}>{label}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium bg-secondary px-2 py-0.5 rounded-full text-muted-foreground tabular-nums">
            {totalCount}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onAddNew(type); }}
            className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title="Add category"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </button>

      {/* Category rows */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {parents.length === 0 ? (
              <div className="px-5 py-6 text-center border-t border-border/50">
                <p className="text-xs text-muted-foreground">No {label.toLowerCase()} categories yet.</p>
                <button
                  onClick={() => onAddNew(type)}
                  className="text-xs text-primary font-medium mt-1 hover:underline"
                >
                  Add one
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/50 border-t border-border/50">
                {parents.map(cat => {
                  const subs = allSubs.filter(s => s.parent_id === cat.id);
                  return (
                    <CategoryRow
                      key={cat.id}
                      cat={cat}
                      subs={subs}
                      onAction={onAction}
                      onAddSub={onAddSub}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}