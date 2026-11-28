import CategoryIcon from '@/components/shared/CategoryIcon';
import {Plus} from 'lucide-react';
import {cn} from '@/lib/utils';

export default function CompactChoiceChip({selected=false,action=false,item,children,onClick}){
 return <button type="button" aria-pressed={action?undefined:selected} onClick={onClick}
 className={cn('inline-flex min-h-8 max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-xs leading-4 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',action?'border-primary/50 text-primary':selected?'border-primary bg-primary/10 text-primary':'border-border bg-muted/30 hover:bg-muted')}>
 {item&&<CategoryIcon icon={item.icon||'tag'} color={item.color} size="xs" bare className="!size-4 !rounded-none"/>}
 {action&&<Plus className="size-3.5 shrink-0"/>}
 <span className="break-words text-left">{children}</span>
 </button>;
}
