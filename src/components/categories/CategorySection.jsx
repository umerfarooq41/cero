import { useState } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import CategoryIcon from '@/components/shared/CategoryIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, TonePill } from '@/components/shared/Premium';

const TYPE_ACCENT = {
  income: 'text-foreground',
  expense: 'text-foreground',
  savings: 'text-foreground',
  debt: 'text-foreground',
};

const TYPE_TONE = {
  income: 'income',
  expense: 'expense',
  savings: 'savings',
  debt: 'debt',
};

function CategoryRow({ cat, subs, onAction, onAddSub }) {
  const [subOpen, setSubOpen] = useState(false);
  const hasSubs = subs.length > 0;

  return (
    <div>
      <div
        className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-foreground/[0.04] dark:hover:bg-secondary/70"
      >
        <CategoryIcon icon={cat.icon} color={cat.color} size="sm" className="rounded-2xl" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-tight">{cat.name}</div>
          {hasSubs && (
            <div className="text-[11px] text-muted-foreground">{subs.length} subcategor{subs.length > 1 ? 'ies' : 'y'}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button
            onClick={() => onAddSub(cat)}
            className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            title="Add subcategory"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAction(cat)}
            className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:bg-accent"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {hasSubs && (
          <button
            onClick={() => setSubOpen(p => !p)}
            className="rounded-xl p-1 text-muted-foreground transition-colors hover:text-foreground"
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
    <div className="group ml-8 flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-foreground/[0.04] dark:hover:bg-secondary/70">
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sub.color || '#888' }} />
      <span className="text-sm text-muted-foreground flex-1 truncate">{sub.name}</span>
      <button
        onClick={() => onAction(sub)}
        className="rounded-xl p-1.5 text-muted-foreground opacity-100 transition-all hover:bg-accent sm:opacity-0 sm:group-hover:opacity-100"
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
    <GlassCard tone={TYPE_TONE[type]} className="p-0">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3.5 transition-colors hover:bg-foreground/[0.03] dark:hover:bg-secondary/70 sm:px-5">
        <button
          type="button"
          onClick={() => setIsOpen(p => !p)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <ChevronDown className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            !isOpen && "-rotate-90"
          )} />
          <h3 className={cn("truncate text-sm font-bold", TYPE_ACCENT[type])}>{label}</h3>
        </button>
        <div className="flex items-center gap-3">
          <TonePill className="px-2 py-0.5">
            {totalCount}
          </TonePill>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddNew(type); }}
            className="rounded-xl p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            title="Add category"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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
              <div className="px-5 py-6 text-center">
                <p className="text-xs text-muted-foreground">No {label.toLowerCase()} categories yet.</p>
                <button
                  onClick={() => onAddNew(type)}
                  className="text-xs text-primary font-medium mt-1 hover:underline"
                >
                  Add one
                </button>
              </div>
            ) : (
              <div className="space-y-1 p-2">
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
    </GlassCard>
  );
}
