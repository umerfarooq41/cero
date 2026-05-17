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
            : 'text-primary';

  const badgeClass =
    tone === 'good'
      ? 'bg-emerald-500/10 ring-emerald-500/15'
      : tone === 'bad'
        ? 'bg-red-500/10 ring-red-500/15'
        : tone === 'warning'
          ? 'bg-amber-500/10 ring-amber-500/15'
          : tone === 'info'
            ? 'bg-cyan-500/10 ring-cyan-500/15'
            : 'bg-primary/10 ring-primary/15';

  const accentClass =
    tone === 'good'
      ? 'bg-emerald-500/70'
      : tone === 'bad'
        ? 'bg-red-500/70'
        : tone === 'warning'
          ? 'bg-amber-500/70'
          : tone === 'info'
            ? 'bg-cyan-500/70'
            : 'bg-primary/70';

  const borderClass =
    tone === 'good'
      ? 'border-emerald-500/10'
      : tone === 'bad'
        ? 'border-red-500/10'
        : tone === 'warning'
          ? 'border-amber-500/10'
          : tone === 'info'
            ? 'border-cyan-500/10'
            : 'border-border/60';

  return (
    <ReflectCard
      className={cn(
        'relative h-full min-h-[124px] overflow-hidden rounded-3xl border bg-card/80 p-4 shadow-sm backdrop-blur-xl transition-colors',
        borderClass
      )}
    >
      <div
        className={cn(
          'absolute left-0 top-4 h-10 w-1 rounded-r-full',
          accentClass
        )}
      />

      <div className="relative flex h-full flex-col pl-2">
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1',
              badgeClass
            )}
          >
            <Icon className={cn('h-4 w-4', toneClass)} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold leading-5 tracking-tight text-foreground">
                {title}
              </h4>

              {metric ? (
                <span
                  className={cn(
                    'inline-flex max-w-[46%] shrink-0 items-center justify-end whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-right text-[11px] font-bold leading-5 tabular-nums',
                    toneClass
                  )}
                >
                  {metric}
                </span>
              ) : null}
            </div>

            <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">
              {text}
            </p>
          </div>
        </div>
      </div>
    </ReflectCard>
  );
}
