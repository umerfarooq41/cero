import { cn } from '@/lib/utils';
import ReflectCard from './ReflectCard.jsx';

const ACCENT_CLASSES = [
  {
    bar: 'bg-emerald-500',
    border: 'border-emerald-500/25',
  },
  {
    bar: 'bg-red-500',
    border: 'border-red-500/25',
  },
  {
    bar: 'bg-blue-500',
    border: 'border-blue-500/25',
  },
  {
    bar: 'bg-amber-500',
    border: 'border-amber-500/25',
  },
  {
    bar: 'bg-purple-500',
    border: 'border-purple-500/25',
  },
  {
    bar: 'bg-cyan-500',
    border: 'border-cyan-500/25',
  },
];

const getAccentFromTitle = (title = '') => {
  const text = String(title);
  const hash = text.split('').reduce((sum, char) => {
    return sum + char.charCodeAt(0);
  }, 0);

  return ACCENT_CLASSES[hash % ACCENT_CLASSES.length];
};

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
          ? 'text-amber-600 dark:text-amber-400'
          : tone === 'info'
            ? 'text-cyan-600 dark:text-cyan-400'
            : 'text-primary';

  const accent = getAccentFromTitle(title);

  return (
    <ReflectCard
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card/85 p-4 shadow-sm backdrop-blur-xl transition-colors',
        accent.border
      )}
    >
      <div
        className={cn(
          'absolute left-0 top-4 h-11 w-1 rounded-r-full',
          accent.bar
        )}
      />

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