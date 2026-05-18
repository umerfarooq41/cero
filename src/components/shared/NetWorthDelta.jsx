/**
 * NetWorthDelta — shows net worth with an animated count-up and
 * a compact assets vs liabilities bar.
 *
 * Drop into Accounts page to replace the static hero card.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

export default function NetWorthDelta({
  netWorth = 0,
  totalAssets = 0,
  totalLiabilities = 0,
  formatCurrency,
}) {
  const fmt = formatCurrency || ((n) => Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 }));
  const animatedNW = useCountUp(Math.abs(netWorth), 750);
  const animatedAssets = useCountUp(totalAssets, 650);
  const animatedLiab = useCountUp(totalLiabilities, 650);

  const total = totalAssets + totalLiabilities;
  const assetPct = total > 0 ? (totalAssets / total) * 100 : 50;

  return (
    <section className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-xl p-5 shadow-md md:p-6">
      {/* Net Worth */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Net Worth</span>
        </div>

        <div className={cn(
          'text-3xl font-bold tracking-tight tabular-nums inline-flex items-center gap-1',
          netWorth >= 0 ? 'text-foreground' : 'text-destructive'
        )}>
          {netWorth < 0 && <span>-</span>}
          {fmt(animatedNW)}
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          The current equilibrium of your efforts
        </p>
      </div>

      {/* Assets vs Liabilities split bar */}
      <div className="relative h-3 rounded-full overflow-hidden bg-destructive/20 mb-4">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-[hsl(var(--success))]"
          initial={{ width: 0 }}
          animate={{ width: `${assetPct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.2 }}
        />
        <motion.div
          className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          initial={{ left: '-3rem' }}
          animate={{ left: '110%' }}
          transition={{ duration: 1.1, delay: 0.9, ease: 'easeInOut' }}
        />
      </div>

      {/* Two stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="h-4 w-4" />
            <span>Assets</span>
          </div>
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {fmt(animatedAssets)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {Math.round(assetPct)}% of total
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-destructive">
            <ArrowDownRight className="h-4 w-4" />
            <span>Liabilities</span>
          </div>
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {fmt(animatedLiab)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {Math.round(100 - assetPct)}% of total
          </div>
        </div>
      </div>
    </section>
  );
}
