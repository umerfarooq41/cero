import React from 'react';
import { cn } from '@/lib/utils';

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
      "rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl p-4 shadow-sm space-y-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foregroundr">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className={cn("text-2xl font-bold tracking-tight tabular-nums", colorMap[type])}>
        {typeof amount === 'string' ? amount : amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      {planned !== undefined && (
        <div className="space-y-1.5">
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isOver ? 'bg-destructive' : barColorMap[type]
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>{Math.abs(amount)?.toLocaleString('en-US', { minimumFractionDigits: 2 })} spent</span>
            <span>{planned?.toLocaleString('en-US', { minimumFractionDigits: 2 })} planned</span>
          </div>
        </div>
      )}
    </div>
  );
}