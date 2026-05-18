import { motion } from 'framer-motion';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 scale-150 rounded-full bg-primary/10 blur-2xl" />

        <div
          className="
            relative flex h-16 w-16 items-center justify-center
            rounded-2xl border border-primary/10
            bg-primary/[0.08]
          "
        >
          {Icon && <Icon className="h-7 w-7 text-primary/60" />}
        </div>
      </div>

      {title && (
        <p className="mb-1 text-base font-semibold text-foreground">
          {title}
        </p>
      )}

      {description && (
        <p className="max-w-xs text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}