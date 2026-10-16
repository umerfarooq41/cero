/**
 * NetWorthDelta — shows net worth with an animated count-up and
 * a compact assets vs liabilities bar.
 *
 * Drop into Accounts page to replace the static hero card.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyNumberText } from '@/lib/currencies';
import { useCountUp } from '@/hooks/useCountUp';

export default function NetWorthDelta({
  netWorth = 0,
  totalAssets = 0,
  totalLiabilities = 0,
  formatCurrency,
}) {
  const fmt =
    formatCurrency ||
    ((n) => formatCurrencyNumberText(Math.abs(n)));

  const animatedNW = useCountUp(Math.abs(netWorth), 750);

  const total = totalAssets + totalLiabilities;
  const assetPct = total > 0 ? (totalAssets / total) * 100 : 50;
  const liabilityPct = total > 0 ? 100 - assetPct : 50;

  return (
    <section className="rounded-2xl app-card-surface px-4 py-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Scale className="size-4" /><span>Net worth</span>
        </div>
        <div className={cn('inline-flex items-center gap-1 text-[28px] font-semibold tracking-tight tabular-nums', netWorth < 0 ? 'text-destructive' : 'text-foreground')}>
          {netWorth < 0 && <span>-</span>}{fmt(animatedNW)}
        </div>
      </div>
      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-muted">
        <motion.div className="h-full bg-[hsl(var(--success))]" initial={{ width: 0 }} animate={{ width: `${assetPct}%` }} transition={{ duration: 0.65 }} />
        <motion.div className="h-full bg-destructive" initial={{ width: 0 }} animate={{ width: `${liabilityPct}%` }} transition={{ duration: 0.65 }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] font-medium">
        <span className="text-emerald-600 dark:text-emerald-400">{Math.round(assetPct)}% Assets</span>
        <span className="text-destructive">{Math.round(liabilityPct)}% Liabilities</span>
      </div>
    </section>
  );
}