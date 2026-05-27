import React, { useState } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import CategoryIcon from '@/components/shared/CategoryIcon';
import { cn } from '@/lib/utils';

const TYPE_ACCENT = {
  income: 'text-green-700 dark:text-green-400',
  expense: 'text-red-700 dark:text-red-400',
  savings: 'text-blue-700 dark:text-blue-400',
  debt: 'text-purple-700 dark:text-purple-400',
};

const rowClass =
  'group flex items-center gap-3 px-4 transition-colors hover:bg-muted/35 dark:hover:bg-muted/20';

function CategoryRow({ cat, subs, onAction, onAddSub }) {
  const [subOpen, setSubOpen] = useState(false);
  const hasSubs = subs.length > 0;

  return (
    <div>
      <div className={cn(rowClass, 'py-3')}>
        <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium leading-tight text-foreground">
            {cat.name}
          </div>

          {hasSubs && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {subs.length} subcategor{subs.length > 1 ? 'ies' : 'y'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onAddSub(cat)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            title="Add subcategory"
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onAction(cat)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            title="Category actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {hasSubs && (
          <button
            type="button"
            onClick={() => setSubOpen((value) => !value)}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-label={subOpen ? 'Hide subcategories' : 'Show subcategories'}
          >
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                subOpen && 'rotate-90'
              )}
            />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {hasSubs && subOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {subs.map((sub) => (
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
    <div className={cn(rowClass, 'border-t border-border/40 py-2.5 pl-[3.5rem]')}>
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: sub.color || '#888' }}
      />

      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
        {sub.name}
      </span>

      <button
        type="button"
        onClick={() => onAction(sub)}
        className="rounded-lg p-1.5 text-muted-foreground opacity-100 transition-all hover:bg-muted/50 hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
        title="Subcategory actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function CategorySection({
  type,
  label,
  categories,
  defaultExpanded = false,
  onAction,
  onAddSub,
  onAddNew,
}) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  const parents = categories.filter((category) => category.type === type && !category.parent_id);
  const allSubs = categories.filter((category) => category.parent_id);
  const totalCount = parents.length + parents.reduce((sum, parent) => {
    return sum + allSubs.filter((sub) => sub.parent_id === parent.id).length;
  }, 0);

  return (
    <div className="overflow-hidden rounded-2xl app-card-surface shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-muted/35 dark:hover:bg-muted/20">
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              !isOpen && '-rotate-90'
            )}
          />

          <h3 className={cn('truncate text-sm font-semibold', TYPE_ACCENT[type])}>
            {label}
          </h3>
        </button>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border/50 bg-background/70 px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {totalCount}
          </span>

          <button
            type="button"
            onClick={() => onAddNew(type)}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            title="Add category"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
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
            {parents.length === 0 ? (
              <div className="border-t border-border/50 px-5 py-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No {label.toLowerCase()} categories yet.
                </p>

                <button
                  type="button"
                  onClick={() => onAddNew(type)}
                  className="mt-1 text-xs font-medium text-primary hover:underline"
                >
                  Add one
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/50 border-t border-border/50">
                {parents.map((category) => {
                  const subs = allSubs.filter((sub) => sub.parent_id === category.id);

                  return (
                    <CategoryRow
                      key={category.id}
                      cat={category}
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
