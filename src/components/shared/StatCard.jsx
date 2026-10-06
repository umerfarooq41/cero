import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatCurrencyNumberText } from '@/lib/currencies';

export default function StatCard({ label, amount, planned, type = 'neutral', icon: Icon, className }) {
  const percentage = planned && planned > 0 ? Math.min((Math.abs(amount) / planned) * 100, 100) : 0;
  const isOver = planned && Math.abs(amount) > planned;
  
  const colorMap = {
    income: 'text-[hsl(var(--success))]',
    expense: 'text-destructive',
    savings: 'text-primary',
    debt: 'text-destructive',
    neutral: 'text-foreground',
  };

  const barColorMap = {
    income: 'bg-[hsl(var(--success))]',
    expense: 'bg-destructive',
    savings: 'bg-primary',
    debt: 'bg-destructive',
    neutral: 'bg-primary',
  };

  return (
    <div className={cn(
      "rounded-2xl app-card-surface backdrop-blur-xl p-4 shadow-sm space-y-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foregroundr">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className={cn("text-2xl font-bold tracking-tight tabular-nums", colorMap[type])}>
        {typeof amount === 'string' ? amount : formatCurrencyNumberText(amount)}
      </div>
      {planned !== undefined && (
        <div className="space-y-1.5">
          <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full',
                isOver ? 'bg-destructive' : barColorMap[type]
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 20,
                delay: 0.1,
              }}
            />
            <motion.div
              className="hidden"
              initial={{ left: '-4rem' }}
              animate={{ left: '110%' }}
              transition={{ duration: 1.2, delay: 0.6, ease: 'easeInOut' }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{formatCurrencyNumberText(Math.abs(amount))} spent</span>
            <span>{formatCurrencyNumberText(planned)} planned</span>
          </div>
        </div>
      )}
    </div>
  );
}