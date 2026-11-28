import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toneClasses } from './settingsAppearance.jsx';

export function IconTile({ icon: Icon, tone = 'blue', className }) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1',
        toneClasses[tone]?.tile || toneClasses.blue.tile,
        className
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
    </div>
  );
}

export function SettingsSection({ title, children }) {
  return (
    <section className="settings-section animate-child mb-5 lg:mb-8 overflow-hidden">
      <div className="settings-section-header flex items-center border-b border-border px-0 py-2.5 lg:border-b-0 lg:py-3">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:!text-[18px] lg:normal-case lg:tracking-normal lg:text-foreground">
            {title}
          </h3>
        </div>
      </div>

      <div className="divide-y divide-border/40">{children}</div>
    </section>
  );
}

export function SettingRow({
  icon,
  tone = 'blue',
  label,
  description,
  children,
  onClick,
  danger = false,
  stackOnMobile = false,
}) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'settings-row w-full min-h-12 px-0.5 py-2.5 lg:min-h-[64px] lg:gap-4 text-left transition-colors',
        onClick && 'rounded-md hover:bg-muted/30',
        stackOnMobile
          ? 'flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'
          : 'flex items-center gap-2.5'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <IconTile icon={icon} tone={danger ? 'rose' : tone} />

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'break-words text-sm font-medium lg:text-[16px]',
              danger && 'text-destructive'
            )}
          >
            {label}
          </div>
          {description && (
            <div className="mt-0.5 break-words text-[11px] leading-4 text-muted-foreground lg:text-[14px] lg:leading-5">
              {description}
            </div>
          )}
        </div>
      </div>

      <div className={cn('shrink-0 self-center', stackOnMobile && 'w-full sm:w-auto')}>{children}</div>
    </Wrapper>
  );
}

export function SegmentedOption({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold lg:px-4 lg:py-2 lg:text-sm transition-all',
        active
          ? 'app-card-surface-strong text-foreground shadow-sm ring-1 ring-border/60'
          : 'text-muted-foreground app-surface-hover hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export function ThemeStyleSwatch({ option, active, onSelect, resolvedTheme }) {
  const accent = resolvedTheme === 'dark' ? option.darkAccent : option.lightAccent;

  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      aria-pressed={active}
      aria-label={`Apply ${option.label} theme style`}
      title={option.label}
      className={cn(
        'relative flex h-9 w-9 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
        active
          ? 'border-primary/45 ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
          : 'border-border/60 hover:border-border/80'
      )}
    >
      <span
        className="h-5 w-5 lg:h-6 lg:w-6 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10"
        style={{ backgroundColor: `hsl(${accent})` }}
      />

      {active && (
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-1 ring-background/80">
          <Check className="h-2.5 w-2.5" />
        </span>
      )}
    </button>
  );
}

