import { cn } from '@/lib/utils';
import DashboardSectionCard from '@/components/dashboard/DashboardSectionCard.jsx';

export default function ReflectInsightCard({
  icon: Icon,
  title,
  text,
  tone = 'default',
  metric,
}) {
  const metricClass =
    tone === 'good'
      ? 'text-[hsl(var(--success))] bg-[hsl(var(--success)/0.08)]'
      : tone === 'bad'
        ? 'text-destructive bg-destructive/10'
        : tone === 'warning'
          ? 'text-amber-500 dark:text-amber-400 bg-amber-500/10'
          : tone === 'info'
            ? 'text-primary bg-primary/10'
            : 'text-primary bg-primary/10';

  return (
    <DashboardSectionCard
      title={title}
      icon={Icon}
      action={
        metric ? (
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold leading-4 tabular-nums',
              metricClass
            )}
          >
            {metric}
          </span>
        ) : null
      }
    >
      <p className="text-xs leading-5 text-muted-foreground">{text}</p>
    </DashboardSectionCard>
  );
}
