import { cn } from '@/lib/utils';
import ReflectCard from './ReflectCard.jsx';

export default function ReflectInsightCard({
  icon: Icon,
  title,
  text,
  tone = 'default',
}) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-500 dark:text-emerald-400'
      : tone === 'bad'
        ? 'text-red-500 dark:text-red-400'
        : tone === 'warning'
          ? 'text-amber-500 dark:text-amber-400'
          : tone === 'info'
            ? 'text-cyan-500 dark:text-cyan-400'
            : 'text-primary';

  const dotClass =
    tone === 'good'
      ? 'bg-emerald-500/12'
      : tone === 'bad'
        ? 'bg-red-500/12'
        : tone === 'warning'
          ? 'bg-amber-500/12'
          : tone === 'info'
            ? 'bg-cyan-500/12'
            : 'bg-primary/12';

  const borderClass =
    tone === 'good'
      ? 'border-emerald-500/15'
      : tone === 'bad'
        ? 'border-red-500/15'
        : tone === 'warning'
          ? 'border-amber-500/15'
          : tone === 'info'
            ? 'border-cyan-500/15'
            : 'border-border/60';

  return (
    <ReflectCard
      className={cn(
        'relative overflow-hidden rounded-3xl border bg-card/75 p-4 shadow-sm backdrop-blur-xl',
        borderClass
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-3xl',
          dotClass
        )}
      />

      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl',
            dotClass
          )}
        >
          <Icon className={cn('h-4 w-4', toneClass)} />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h4>

          <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {text}
          </div>
        </div>
      </div>
    </ReflectCard>
  );
}