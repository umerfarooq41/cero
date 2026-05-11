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
        ? 'text-red-500'
        : tone === 'warning'
          ? 'text-amber-500'
          : 'text-primary';

  const iconBg =
    tone === 'good'
      ? 'bg-emerald-500/10'
      : tone === 'bad'
        ? 'bg-red-500/10'
        : tone === 'warning'
          ? 'bg-amber-500/10'
          : 'bg-primary/10';

  return (
    <ReflectCard className="p-4 transition-colors hover:bg-accent/30">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
            iconBg
          )}
        >
          <Icon className={cn('h-4 w-4', toneClass)} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-foreground">
            {title}
          </p>

          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {text}
          </p>
        </div>
      </div>
    </ReflectCard>
  );
}
