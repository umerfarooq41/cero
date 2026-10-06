import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  Target,
} from "lucide-react";

import CategoryIcon from "@/components/shared/CategoryIcon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TYPE_ACCENT = {
  income: "text-green-700 dark:text-green-400",
  expense: "text-red-700 dark:text-red-400",
  transfer: "text-sky-700 dark:text-sky-400",
  active: "text-blue-700 dark:text-blue-400",
};

const TYPE_ICONS = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  transfer: ArrowLeftRight,
  active: Target,
};

export function ScheduledSectionCard({
  type = "active",
  label,
  count,
  defaultExpanded = false,
  emptyText,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const Icon = TYPE_ICONS[type] || Target;

  return (
    <div className="overflow-hidden rounded-2xl app-card-surface">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-accent/30"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              !isOpen && "-rotate-90",
            )}
          />
          <Icon className={cn("h-4 w-4 shrink-0", TYPE_ACCENT[type])} />
          <h3
            className={cn("truncate text-sm font-semibold", TYPE_ACCENT[type])}
          >
            {label}
          </h3>
        </div>

        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {count}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 1 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {count === 0 ? (
              <div className="border-t border-border/50 px-5 py-6 text-center">
                <p className="text-xs text-muted-foreground">{emptyText}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 border-t border-border/50">
                {children}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ScheduledStatusBadge({ children, className }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 rounded-full px-2 py-0 text-[10px] font-semibold leading-none",
        className,
      )}
    >
      {children}
    </Badge>
  );
}

export default function ScheduledItemCard({
  icon,
  color,
  title,
  subtitle,
  meta,
  amount,
  actions,
}) {
  return (
    <div className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40">
      <CategoryIcon icon={icon} color={color} size="sm" />

      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="min-w-0 truncate text-sm font-semibold leading-tight">
          {title}
        </h3>

        {subtitle && (
          <div className="mt-1 min-w-0 text-xs font-medium text-muted-foreground">
            {subtitle}
          </div>
        )}

        {meta && (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {meta}
          </div>
        )}
      </div>

      <div className="ml-1 flex max-w-[9.75rem] flex-col items-end gap-2 text-right">
        <div className="text-sm font-semibold tabular-nums text-foreground">
          {amount}
        </div>

        {actions}
      </div>
    </div>
  );
}
