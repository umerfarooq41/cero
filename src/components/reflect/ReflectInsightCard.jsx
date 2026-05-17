import { cn } from '@/lib/utils';
import ReflectCard from './ReflectCard.jsx';

const ACCENT_CLASSES = {
  red: {
    bar: 'bg-red-500',
    border: 'border-red-500/25',
  },
  yellow: {
    bar: 'bg-amber-500',
    border: 'border-amber-500/25',
  },
  blue: {
    bar: 'bg-blue-500',
    border: 'border-blue-500/25',
  },
  green: {
    bar: 'bg-emerald-500',
    border: 'border-emerald-500/25',
  },
  purple: {
    bar: 'bg-purple-500',
    border: 'border-purple-500/25',
  },
};

const getAccentFromTitle = (title = '') => {
  const normalized = String(title).toLowerCase();

  if (
    normalized.includes('cash flow') ||
    normalized.includes('overspending') ||
    normalized.includes('negative') ||
    normalized.includes('alert')
  ) {
    return ACCENT_CLASSES.red;
  }

  if (
    normalized.includes('budget') ||
    normalized.includes('warning') ||
    normalized.includes('pace') ||
    normalized.includes('plan')
  ) {
    return ACCENT_CLASSES.yellow;
  }

  if (
    normalized.includes('income') ||
    normalized.includes('monthly') ||
    normalized.includes('yearly') ||
    normalized.includes('performance')
  ) {
    return ACCENT_CLASSES.blue;
  }

  if (
    normalized.includes('saving') ||
    normalized.includes('saved') ||
    normalized.includes('surplus') ||
    normalized.includes('positive')
  ) {
    return ACCENT_CLASSES.green;
  }

  return ACCENT_CLASSES.purple;
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