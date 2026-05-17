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
    <ReflectCard
      className="
        relative overflow-hidden rounded-2xl border border-border/60 bg-card/85 p-4 shadow-sm backdrop-blur-xl transition-colors
        [&:nth-child(5n+1)_.insight-accent-bar]:bg-red-500
        [&:nth-child(5n+2)_.insight-accent-bar]:bg-yellow-500
        [&:nth-child(5n+3)_.insight-accent-bar]:bg-blue-500
        [&:nth-child(5n+4)_.insight-accent-bar]:bg-emerald-500
        [&:nth-child(5n+5)_.insight-accent-bar]:bg-purple-500
      "
    >
      <div className="insight-accent-bar absolute left-0 top-4 h-11 w-1 rounded-r-full bg-red-500" />

      <div className="relative pl-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

          <h4 className="min-w-0 flex-1 text-[15px] font-semibold leading-5 tracking-tight text-foreground">
            {title}
          </h4>

          {metric ? (
            <span
              className={cn(
                'shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold leading-5 tabular-nums',
                metricClass
              )}
            >
              {metric}
            </span>
          ) : null}
        </div>

        <p className="mt-1 text-left text-[13px] leading-5 text-muted-foreground">
          {text}
        </p>
      </div>
    </ReflectCard>
  );
}