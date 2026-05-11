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
      ? 'text-emerald-500'
      : tone === 'bad'
        ? 'text-destructive'
        : tone === 'warning'
          ? 'text-amber-500'
          : 'text-primary';

  const dotClass =
    tone === 'good'
      ? 'bg-emerald-500/12'
      : tone === 'bad'
        ? 'bg-destructive/12'
        : tone === 'warning'
          ? 'bg-amber-500/12'
          : 'bg-primary/12';

  return (
    <ReflectCard className="p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl',
            dotClass
          )}
        >
          <Icon className={cn('h-4 w-4', toneClass)} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-none text-foreground">
            {title}
          </p>

          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {text}
          </p>
        </div>
      </div>
    </ReflectCard>
  );
}
