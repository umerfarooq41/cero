import { SectionHeading } from '@/components/shared/WorkspacePrimitives';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function IconTile({ icon: Icon, tone = 'blue', className }) {
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground',
        tone === 'rose' && 'text-destructive',
        className
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

export function SettingsSection({ title, children }) {
  return (
    <section className="settings-section animate-child mb-4 lg:mb-6 overflow-hidden">
      <div className="settings-section-header flex items-center border-b border-border px-0 py-2.5 lg:border-b-0 lg:py-3">
        <SectionHeading title={title} as="h3" className="text-foreground lg:normal-case lg:tracking-normal"/>
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
        'settings-row w-full min-h-12 px-0.5 py-2 lg:min-h-[52px] lg:gap-4 text-left transition-colors',
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
              'break-words text-sm font-medium',
              danger && 'text-destructive'
            )}
          >
            {label}
          </div>
          {description && (
            <div className="mt-0.5 break-words text-xs leading-4 text-muted-foreground lg:text-[14px] lg:leading-5">
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
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-sm px-2 h-8 text-sm font-medium lg:px-4 transition-colors',
        active
          ? 'bg-primary/10 text-primary'
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
        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
        active
          ? 'border-primary'
          : 'border-transparent hover:border-border'
      )}
    >
      <span
        className="h-7 w-7 rounded-full ring-1 ring-black/5 dark:ring-white/10"
        style={{ backgroundColor: `hsl(${accent})` }}
      />

      {active && (
        <span className="absolute inset-0 flex items-center justify-center text-primary-foreground">
          <Check className="h-4 w-4" />
        </span>
      )}
    </button>
  );
}

