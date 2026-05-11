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
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'bad'
        ? 'text-destructive'
        : tone === 'warning'
          ? 'text-amber-500'
          : 'text-primary';

  return (
    <ReflectCard
      className={cn(
        'overflow-hidden p-4',
        tone === 'good' &&
          'bg-gradient-to-br from-emerald-50 via-card to-card dark:from-emerald-950/25',
        tone === 'bad' &&
          'bg-gradient-to-br from-red-50 via-card to-card dark:from-red-950/25',
        tone === 'warning' &&
          'bg-gradient-to-br from-amber-50 via-card to-card dark:from-amber-950/20'
      )}
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background/70 shadow-sm">
          <Icon className={cn('h-4 w-4', toneClass)} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {text}
          </p>
        </div>
      </div>
    </ReflectCard>
  );
}
