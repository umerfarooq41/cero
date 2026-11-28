import { SectionHeading } from '@/components/shared/WorkspacePrimitives';
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
        'rounded-2xl border border-border/50 bg-card/70 shadow-sm backdrop-blur-xl px-4 pb-3 pt-4',
        className
      )}
    >
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <SectionHeading title={title} icon={Icon} className="cero-dashboard-section-title text-sm font-semibold text-foreground"/>

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
