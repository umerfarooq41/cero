import { cn } from '@/lib/utils';
import ReflectCard from './ReflectCard.jsx';

export default function ReflectInsightCard({
  icon: Icon,
  title,
  text,
  tone = 'default',
  metric,
}) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'bad'
        ? 'text-red-600 dark:text-red-400'
        : tone === 'warning'
          ? 'text-amber-600 dark:text-amber-400'
          : tone === 'info'
            ? 'text-cyan-600 dark:text-cyan-400'
            : tone === 'default'
              ? 'text-primary'
              : 'text-primary';

  const iconClass =
    tone === 'good'
      ? 'bg-emerald-500/10 ring-emerald-500/15'
      : tone === 'bad'
        ? 'bg-red-500/10 ring-red-500/15'
        : tone === 'warning'
          ? 'bg-amber-500/10 ring-amber-500/15'
          : tone === 'info'
            ? 'bg-cyan-500/10 ring-cyan-500/15'
            : 'bg-primary/10 ring-primary/15';

  const leftBorderClass =
    tone === 'good'
      ? 'bg-emerald-500'
      : tone === 'bad'
        ? 'bg-red-500'
        : tone === 'warning'
          ? 'bg-amber-500'
          : tone === 'info'
            ? 'bg-cyan-500'
            : 'bg-primary';

  const borderClass =
    tone === 'good'
      ? 'border-emerald-500/15'
      : tone === 'bad'
        ? 'border-red-500/15'
        : tone === 'warning'
          ? 'border-amber-500/15'
          : tone === 'info'
            ? 'border-cyan-500/15'
            : 'border-border/70';

  return (
    <ReflectCard
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card/85 p-4 shadow-sm backdrop-blur-xl transition-colors',
        borderClass
      )}
    >
      {/* Left color highlight */}
      <div
        className={cn(
          'absolute left-0 top-4 h-11 w-1 rounded-r-full',
          leftBorderClass
        )}
      />

      <div className="relative pl-2.5">
        {/* Icon + heading inline */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1',
                iconClass
              )}
            >
              <Icon className={cn('h-4 w-4', toneClass)} />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-[15px] font-semibold leading-5 tracking-tight text-foreground">
                {title}
              </h4>

              <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                {text}
              </p>
            </div>
          </div>

          {metric ? (
            <span
              className={cn(
                'shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold leading-5 tabular-nums',
                toneClass
              )}
            >
              {metric}
            </span>
          ) : null}
        </div>
      </div>
    </ReflectCard>
  );
}