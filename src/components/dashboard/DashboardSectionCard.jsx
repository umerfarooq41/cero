import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardSectionCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur-xl sm:p-4 md:p-5',
        className
      )}
    >
      <div className="mb-3 flex min-w-0 items-start justify-between gap-2.5 sm:mb-4 sm:gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            {Icon ? (
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : null}

            <h2 className="min-w-0 truncate text-sm font-bold tracking-tight text-foreground md:text-base">
              {title}
            </h2>
          </div>

          {subtitle ? (
            <p className="mt-1 truncate text-xs leading-5 text-muted-foreground sm:whitespace-normal">
              {subtitle}
            </p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className={cn('min-w-0', contentClassName)}>{children}</div>
    </section>
  );
}

export function DashboardGhostAction({ asChild = true, children, className }) {
  return (
    <Button
      asChild={asChild}
      variant="ghost"
      size="sm"
      className={cn('h-8 shrink-0 gap-1 px-2 text-xs font-semibold sm:px-3', className)}
    >
      {children}
    </Button>
  );
}
