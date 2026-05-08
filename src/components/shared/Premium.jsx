import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const toneStyles = {
  default: {
    card: 'bg-card',
    icon: 'bg-secondary text-muted-foreground',
    text: 'text-foreground',
    pill: 'bg-secondary text-secondary-foreground',
  },
  income: {
    card: 'bg-emerald-50/70 dark:bg-emerald-950/20',
    icon: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/45 dark:text-emerald-300',
    text: 'text-emerald-800 dark:text-emerald-200',
    pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/55 dark:text-emerald-200',
  },
  expense: {
    card: 'bg-blue-50/70 dark:bg-blue-950/20',
    icon: 'bg-blue-100 text-blue-700 dark:bg-blue-900/45 dark:text-blue-300',
    text: 'text-blue-800 dark:text-blue-200',
    pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/55 dark:text-blue-200',
  },
  savings: {
    card: 'bg-teal-50/75 dark:bg-teal-950/22',
    icon: 'bg-teal-100 text-teal-700 dark:bg-teal-900/45 dark:text-teal-300',
    text: 'text-teal-800 dark:text-teal-200',
    pill: 'bg-teal-100 text-teal-800 dark:bg-teal-900/55 dark:text-teal-200',
  },
  debt: {
    card: 'bg-red-50/70 dark:bg-red-950/20',
    icon: 'bg-red-100 text-red-700 dark:bg-red-900/45 dark:text-red-300',
    text: 'text-red-800 dark:text-red-200',
    pill: 'bg-red-100 text-red-800 dark:bg-red-900/55 dark:text-red-200',
  },
  transfer: {
    card: 'bg-cyan-50/70 dark:bg-cyan-950/20',
    icon: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/45 dark:text-cyan-300',
    text: 'text-cyan-800 dark:text-cyan-200',
    pill: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/55 dark:text-cyan-200',
  },
  analytics: {
    card: 'bg-violet-50/70 dark:bg-violet-950/22',
    icon: 'bg-violet-100 text-violet-700 dark:bg-violet-900/45 dark:text-violet-300',
    text: 'text-violet-800 dark:text-violet-200',
    pill: 'bg-violet-100 text-violet-800 dark:bg-violet-900/55 dark:text-violet-200',
  },
  warning: {
    card: 'bg-amber-50/75 dark:bg-amber-950/22',
    icon: 'bg-amber-100 text-amber-800 dark:bg-amber-900/45 dark:text-amber-300',
    text: 'text-amber-900 dark:text-amber-200',
    pill: 'bg-amber-100 text-amber-900 dark:bg-amber-900/55 dark:text-amber-200',
  },
};

export function MotionSurface({ children, className, delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut', delay }}
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
        'material-card overflow-hidden rounded-[1.25rem]',
        styles.card,
        className
      )}
    >
      {children}
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
          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-[1.1rem] bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-[1.65rem] font-semibold leading-tight tracking-[-0.01em] sm:text-[2rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
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
      <div className="flex min-h-[6.25rem] flex-col justify-between gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          {Icon && (
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-2xl', styles.icon)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div>
          <div className={cn('text-xl font-semibold tracking-[-0.01em] sm:text-2xl', styles.text)}>
            <MoneyAmount>{value}</MoneyAmount>
          </div>
          {detail && (
            <div className="mt-1.5 text-xs leading-5 text-muted-foreground">
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
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-2xl', styles.icon)}>
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h2 className="truncate text-sm font-semibold">{title}</h2>}
              {description && (
                <p className="mt-0.5 truncate text-xs leading-5 text-muted-foreground">
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
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
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
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        styles.pill,
        className
      )}
    >
      {children}
    </span>
  );
}
