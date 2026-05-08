import { motion } from 'framer-motion';
import AppHeader from '@/components/shared/AppHeader';
import { cn } from '@/lib/utils';

const toneStyles = {
  default: {
    card: 'bg-card',
    icon: 'bg-secondary text-muted-foreground',
    text: 'text-foreground',
    pill: 'bg-secondary text-secondary-foreground',
  },
  income: {
    card: 'bg-card',
    icon: 'bg-secondary text-muted-foreground',
    text: 'text-foreground',
    pill: 'bg-secondary text-secondary-foreground',
  },
  expense: {
    card: 'bg-card',
    icon: 'bg-secondary text-muted-foreground',
    text: 'text-foreground',
    pill: 'bg-secondary text-secondary-foreground',
  },
  savings: {
    card: 'bg-card',
    icon: 'bg-secondary text-muted-foreground',
    text: 'text-foreground',
    pill: 'bg-secondary text-secondary-foreground',
  },
  debt: {
    card: 'bg-card',
    icon: 'bg-secondary text-muted-foreground',
    text: 'text-foreground',
    pill: 'bg-secondary text-secondary-foreground',
  },
  transfer: {
    card: 'bg-card',
    icon: 'bg-secondary text-muted-foreground',
    text: 'text-foreground',
    pill: 'bg-secondary text-secondary-foreground',
  },
  analytics: {
    card: 'bg-card',
    icon: 'bg-secondary text-muted-foreground',
    text: 'text-foreground',
    pill: 'bg-secondary text-secondary-foreground',
  },
  warning: {
    card: 'bg-card',
    icon: 'bg-secondary text-muted-foreground',
    text: 'text-foreground',
    pill: 'bg-secondary text-secondary-foreground',
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
    <AppHeader
      title={title}
      description={description}
      eyebrow={eyebrow}
      icon={Icon}
      actions={actions}
      className={className}
    />
  );
}

export { AppHeader };

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
