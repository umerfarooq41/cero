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
  const animatedAssets = useCountUp(totalAssets, 650);
  const animatedLiab = useCountUp(totalLiabilities, 650);

  const total = totalAssets + totalLiabilities;
  const assetPct = total > 0 ? (totalAssets / total) * 100 : 50;
  const liabilityPct = total > 0 ? 100 - assetPct : 50;

  return (
    <section className="rounded-3xl app-card-surface p-5 shadow-md backdrop-blur-xl md:p-6">
      {/* Net Worth */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Net Worth
          </span>
        </div>

        <div
          className={cn(
            'inline-flex items-center gap-1 text-3xl font-bold tracking-tight tabular-nums',
            netWorth >= 0 ? 'text-foreground' : 'text-destructive'
          )}
        >
          {netWorth < 0 && <span>-</span>}
          {fmt(animatedNW)}
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          The current equilibrium of your efforts
        </p>
      </div>

      {/* Assets vs Liabilities split bar */}
      <div className="relative mb-4 h-3 overflow-hidden rounded-full bg-destructive/20">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-[hsl(var(--success))]"
          initial={{ width: 0 }}
          animate={{ width: `${assetPct}%` }}
          transition={{
            type: 'spring',
            stiffness: 80,
            damping: 18,
            delay: 0.2,
          }}
        />

        <motion.div
          className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
          initial={{ left: '-3rem' }}
          animate={{ left: '110%' }}
          transition={{
            duration: 1.1,
            delay: 0.9,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Two stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center justify-center rounded-2xl app-card-surface p-4 text-center shadow-sm backdrop-blur-xl">
          <div className="mb-1.5 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>Assets</span>
          </div>

          <div className="text-sm font-medium tabular-nums text-foreground sm:text-[15px]">
            {fmt(animatedAssets)}
          </div>

          <div className="mt-1 text-[11px] text-muted-foreground">
            {Math.round(assetPct)}% of total
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl app-card-surface p-4 text-center shadow-sm backdrop-blur-xl">
          <div className="mb-1.5 flex items-center justify-center gap-1.5 text-xs font-medium text-destructive">
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>Liabilities</span>
          </div>

          <div className="text-sm font-medium tabular-nums text-foreground sm:text-[15px]">
            {fmt(animatedLiab)}
          </div>

          <div className="mt-1 text-[11px] text-muted-foreground">
            {Math.round(liabilityPct)}% of total
          </div>
        </div>
      </div>
    </section>
  );
}