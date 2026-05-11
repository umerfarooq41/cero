import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ReflectCard({ children, className }) {
  return (
    <motion.div className={cn('rounded-2xl border border-border bg-card shadow-sm', className)}>
      {children}
    </motion.div>
  );
}
