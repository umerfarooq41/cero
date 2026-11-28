import { SectionHeading } from '@/components/shared/WorkspacePrimitives';
import { createContext, useContext, useId, useState } from "react";
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
    <div className="overflow-hidden border-b border-border/50 bg-transparent">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between px-0 py-2.5 transition-colors hover:bg-accent/30"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              !isOpen && "-rotate-90",
            )}
          />
          <SectionHeading title={label} icon={Icon} as="span"/>
        </div>

        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
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
              <div className="border-t border-border/50 px-0 py-3 text-center">
                <p className="text-xs text-muted-foreground">{emptyText}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 border-t border-border/50 lg:border-t-0">
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

const ExpansionContext = createContext(null);
export function ScheduledAccordion({ children }) {
  const [expanded, setExpanded] = useState(null);
  return <ExpansionContext.Provider value={{ expanded, setExpanded }}>{children}</ExpansionContext.Provider>;
}

export default function ScheduledItemCard({
  icon,
  color,
  title,
  subtitle,
  meta,
  amount,
  actions,
  details = [],
}) {
  const id = useId();
  const group = useContext(ExpansionContext);
  const [localOpen, setLocalOpen] = useState(false);
  const open = group ? group.expanded === id : localOpen;
  const toggle = () => group ? group.setExpanded(open ? null : id) : setLocalOpen(!open);
  return (
    <div>
    <div className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-0 py-2.5 transition-colors hover:bg-accent/40 lg:items-center lg:px-0 lg:py-2.5">
      <button type="button" aria-label={`${open ? "Collapse" : "Expand"} ${title}`} aria-expanded={open} aria-controls={id} onClick={toggle} className="flex items-center gap-1"><CategoryIcon icon={icon} color={color} size="sm" /><ChevronDown className={cn("size-3 text-muted-foreground transition-transform", open && "rotate-180")}/></button>

      <button type="button" aria-expanded={open} aria-controls={id} onClick={toggle} className="min-w-0 flex-1 pt-0.5 text-left">
        <h3 className="min-w-0 truncate text-sm font-medium leading-tight">
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
      </button>

      <div className="ml-1 flex max-w-[9.75rem] flex-col items-end gap-2 text-right lg:grid lg:max-w-none lg:grid-cols-[minmax(8rem,auto)_10rem] lg:items-center lg:gap-4">
        <div className="text-sm font-semibold tabular-nums text-foreground">
          {amount}
        </div>

        {actions}
      </div>
    </div>
    <AnimatePresence initial={false}>{open && <motion.div id={id} initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.18}} className="overflow-hidden"><dl className="space-y-2 border-t border-border/50 py-3 pl-2">{details.filter(([,value])=>value !== null && value !== undefined && value !== "").map(([label,value])=><div key={label} className="flex justify-between gap-3 text-xs"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl></motion.div>}</AnimatePresence>
    </div>
  );
}
