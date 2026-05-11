import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ReflectCard({ children, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'rounded-2xl border border-border bg-card shadow-sm',
        className
      )}
    >
      {children}
    </motion.div>
  );
}