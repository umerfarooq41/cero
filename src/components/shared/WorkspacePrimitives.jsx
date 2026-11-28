import { cn } from '@/lib/utils';

export function SectionHeading({ title, icon: Icon, className, as: Heading = 'h2' }) {
  return <div className="flex min-w-0 items-center gap-2">{Icon && <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground"/>}<Heading className={cn('min-w-0 truncate cero-section-title', className)}>{title}</Heading></div>;
}

export function WorkspaceTab({ active, children, className, ...props }) {
  return <button type="button" aria-pressed={active} {...props} className={cn('shrink-0 border-b-2 px-2 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring', active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground', className)}>{children}</button>;
}
