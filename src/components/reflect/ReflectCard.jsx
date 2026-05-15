import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ReflectCard({ children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'rounded-2xl border border-border bg-card shadow-sm overflow-hidden',
        'focus:outline-none focus-visible:outline-none',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
