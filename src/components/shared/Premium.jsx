import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const toneStyles = {
  default: {
    card: 'from-white/85 via-white/76 to-white/66 dark:from-white/[0.09] dark:via-white/[0.07] dark:to-white/[0.04]',
    icon: 'bg-secondary text-muted-foreground',
    text: 'text-foreground',
    glow: 'bg-primary/10',
  },
  income: {
    card: 'from-emerald-50/95 via-white/82 to-white/70 dark:from-emerald-500/14 dark:via-white/[0.07] dark:to-white/[0.04]',
    icon: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
    text: 'text-emerald-700 dark:text-emerald-300',
    glow: 'bg-emerald-400/18',
  },
  expense: {
    card: 'from-blue-50/95 via-white/82 to-white/70 dark:from-blue-500/14 dark:via-white/[0.07] dark:to-white/[0.04]',
    icon: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-300',
    glow: 'bg-blue-400/18',
  },
  savings: {
    card: 'from-teal-50/95 via-white/82 to-white/70 dark:from-teal-500/14 dark:via-white/[0.07] dark:to-white/[0.04]',
    icon: 'bg-teal-500/12 text-teal-700 dark:text-teal-300',
    text: 'text-teal-700 dark:text-teal-300',
    glow: 'bg-teal-400/18',
  },
  debt: {
    card: 'from-red-50/95 via-white/82 to-white/70 dark:from-red-500/14 dark:via-white/[0.07] dark:to-white/[0.04]',
    icon: 'bg-red-500/12 text-red-700 dark:text-red-300',
    text: 'text-red-700 dark:text-red-300',
    glow: 'bg-red-400/18',
  },
  transfer: {
    card: 'from-cyan-50/95 via-white/82 to-white/70 dark:from-cyan-500/14 dark:via-white/[0.07] dark:to-white/[0.04]',
    icon: 'bg-cyan-500/12 text-cyan-700 dark:text-cyan-300',
    text: 'text-cyan-700 dark:text-cyan-300',
    glow: 'bg-cyan-400/18',
  },
  analytics: {
    card: 'from-violet-50/95 via-white/82 to-white/70 dark:from-violet-500/16 dark:via-white/[0.07] dark:to-white/[0.04]',
    icon: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
    text: 'text-violet-700 dark:text-violet-300',
    glow: 'bg-violet-400/18',
  },
  warning: {
    card: 'from-amber-50/95 via-white/82 to-white/70 dark:from-amber-500/14 dark:via-white/[0.07] dark:to-white/[0.04]',
    icon: 'bg-amber-500/14 text-amber-700 dark:text-amber-300',
    text: 'text-amber-700 dark:text-amber-300',
    glow: 'bg-amber-400/18',
  },
};

export function MotionSurface({ children, className, delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut', delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MoneyAmount({ children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center align-middle whitespace-nowrap leading-none tabular-nums [&_img]:shrink-0 [&_svg]:shrink-0',
        className
      )}
    >
      {children}
    </span>
  );
}

export function GlassCard({ children, className, tone = 'default', delay = 0 }) {
  const styles = toneStyles[tone] || toneStyles.default;

  return (
    <MotionSurface
      delay={delay}
      className={cn(
        'premium-card relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br',
        styles.card,
        className
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl',
          styles.glow
        )}
      />
      <div className="relative">{children}</div>
    </MotionSurface>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
  className,
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'default',
  className,
  delay = 0,
}) {
  const styles = toneStyles[tone] || toneStyles.default;

  return (
    <GlassCard tone={tone} delay={delay} className={cn('p-4', className)}>
      <div className="flex min-h-[7.25rem] flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          {Icon && (
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-2xl', styles.icon)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div>
          <div className={cn('text-2xl font-bold tracking-tight sm:text-[1.7rem]', styles.text)}>
            <MoneyAmount>{value}</MoneyAmount>
          </div>
          {detail && (
            <div className="mt-2 text-xs leading-snug text-muted-foreground">
              {detail}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
  tone = 'default',
}) {
  const styles = toneStyles[tone] || toneStyles.default;

  return (
    <GlassCard tone={tone} className={cn('p-0', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border/55 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-2xl', styles.icon)}>
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h2 className="truncate text-sm font-semibold">{title}</h2>}
              {description && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn('p-4 sm:p-5', bodyClassName)}>{children}</div>
    </GlassCard>
  );
}

export function ChartCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
  tone = 'default',
}) {
  return (
    <SectionCard
      title={title}
      description={subtitle}
      icon={Icon}
      action={action}
      tone={tone}
      className={className}
      bodyClassName="p-4 sm:p-5"
    >
      {children}
    </SectionCard>
  );
}

export function InsightCard({ icon: Icon, title, children, tone = 'default', className }) {
  const styles = toneStyles[tone] || toneStyles.default;

  return (
    <GlassCard tone={tone} className={cn('p-4', className)}>
      <div className="flex gap-3">
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', styles.icon)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export function TonePill({ children, tone = 'default', className }) {
  const styles = toneStyles[tone] || toneStyles.default;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        styles.icon,
        className
      )}
    >
      {children}
    </span>
  );
}
