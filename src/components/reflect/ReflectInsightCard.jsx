import { cn } from '@/lib/utils';
import ReflectCard from './ReflectCard.jsx';

export default function ReflectInsightCard({
  icon: Icon,
  title,
  text,
  tone = 'default',
  metric,
}) {
  const metricClass =
    tone === 'good'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'bad'
        ? 'text-red-600 dark:text-red-400'
        : tone === 'warning'
          ? 'text-yellow-600 dark:text-yellow-400'
          : tone === 'info'
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-primary';

  return (
    <ReflectCard className="rounded-3xl border border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur-xl sm:p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            {Icon ? (
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : null}

            <h4 className="min-w-0 truncate text-sm font-bold tracking-tight text-foreground">
              {title}
            </h4>
          </div>

          <p className="mt-1 line-clamp-2 text-left text-xs leading-4 text-muted-foreground">
            {text}
          </p>
        </div>

        {metric ? (
          <span
            className={cn(
              'shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold leading-4 tabular-nums',
              metricClass
            )}
          >
            {metric}
          </span>
        ) : null}
      </div>
    </ReflectCard>
  );
}
