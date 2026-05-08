import { cn } from '@/lib/utils';

export default function AppHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
  className,
  actionClassName,
}) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-3 gap-y-2',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 basis-[14rem] items-center gap-3">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] bg-secondary text-muted-foreground sm:h-12 sm:w-12">
            <Icon className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {eyebrow && (
            <div className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {eyebrow}
            </div>
          )}
          <h1 className="break-words text-[1.35rem] font-semibold leading-[1.12] tracking-[-0.01em] text-foreground sm:text-[1.55rem] lg:text-[1.65rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-[34rem] overflow-hidden text-xs leading-5 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:text-sm">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div
          className={cn(
            'ml-auto flex shrink-0 items-center justify-end gap-2 max-[420px]:basis-full',
            actionClassName
          )}
        >
          {actions}
        </div>
      )}
    </header>
  );
}
