import { cn } from '@/lib/utils';

const sourceBadgeToneClasses = {
  income:
    'border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  expense:
    'border-red-500/15 bg-red-500/10 text-red-700 dark:text-red-400',
  savings:
    'border-blue-500/15 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  debt: 'border-purple-500/15 bg-purple-500/10 text-purple-700 dark:text-purple-400',
  transfer:
    'border-sky-500/15 bg-sky-500/10 text-sky-700 dark:text-sky-400',
};

function normalizeBadgeTone(tone) {
  if (tone === 'saving') return 'savings';
  if (tone === 'liability') return 'debt';
  if (tone === 'asset') return 'savings';
  return tone || 'transfer';
}

export default function SourceBadge({ type, tone = 'transfer', compact = false, className }) {
  if (!type) return null;

  const normalizedType = String(type).toLowerCase();
  const isGoal = normalizedType === 'goal' || normalizedType === 'savings_goal';
  const isRecurring = normalizedType === 'recurring';

  // Category/manual plan rows are not recurring sources and should not carry a badge.
  if (!isGoal && !isRecurring) return null;
  const normalizedTone = normalizeBadgeTone(tone);
  const toneClass =
    sourceBadgeToneClasses[normalizedTone] || sourceBadgeToneClasses.transfer;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold leading-none',
        toneClass,
        className
      )}
    >
      {compact ? (isGoal ? 'G' : 'R') : isGoal ? 'Goal' : 'Recurring'}
    </span>
  );
}
