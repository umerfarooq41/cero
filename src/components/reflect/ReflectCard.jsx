import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * ReflectCard — visual chrome matching DashboardSectionCard:
 *   rounded-3xl, border/60, app-card-surface, backdrop-blur-xl, shadow-sm
 * Used inside RevealChartCard (animation) in ReflectCharts, and
 * directly in ReflectSummaryCard.
 */
export default function ReflectCard({ children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'overflow-hidden rounded-3xl app-card-surface backdrop-blur-xl shadow-sm lg:h-full',
        'focus:outline-none focus-visible:outline-none',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
