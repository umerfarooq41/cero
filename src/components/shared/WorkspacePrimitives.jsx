import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SectionHeading({ title, icon: Icon, className, as: Heading = 'h2' }) {
  return <div className="flex min-w-0 items-center gap-2">{Icon && <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground"/>}<Heading className={cn('min-w-0 truncate cero-section-title', className)}>{title}</Heading></div>;
}

export function WorkspaceTab({ active, children, className, ...props }) {
  return <button type="button" aria-pressed={active} {...props} className={cn('shrink-0 border-b-2 px-2 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring', active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground', className)}>{children}</button>;
}

export function RegisterHeader({ children, className }) {
  return <thead className={cn('text-muted-foreground', className)}>{children}</thead>;
}

export function RegisterRow({ selected, className, children, ...props }) {
  return <tr {...props} className={cn('border-b border-border/60 hover:bg-muted/30', selected && 'bg-primary/10', className)}>{children}</tr>;
}

export function RegisterInspector({ children, className }) {
  return <aside className={cn('cero-desktop-inspector workspace:border-l workspace:px-5', className)}>{children}</aside>;
}

export function RegisterEmpty({ children, className }) {
  return <p className={cn('p-8 text-center text-sm text-muted-foreground', className)}>{children}</p>;
}

export function WorkspaceAddButton({ className, children, ...props }) {
  return <Button size="sm" variant="outline" {...props} className={cn('cero-add-action cero-desktop-only-action', className)}>{children}</Button>;
}

export function WorkspaceIconButton({ className, children, ...props }) {
  return <Button variant="ghost" size="icon" {...props} className={cn('[&_svg]:size-4', className)}>{children}</Button>;
}
