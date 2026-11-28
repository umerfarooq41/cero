import {useState} from 'react';
import {format,addDays,startOfWeek,parseISO} from 'date-fns';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import {Input} from '@/components/ui/input';
export default function QuickDates({value,onChange}) {
  const today=new Date();
  const [week,setWeek]=useState(()=>startOfWeek(value?parseISO(value):today));
  const pick=d=>onChange(format(d,'yyyy-MM-dd'));
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">{[['Today',today],['Yesterday',addDays(today,-1)]].map(([label,d])=><button key={label} type="button" onClick={()=>pick(d)} className={'rounded-full border px-3 py-2 text-xs '+(value===format(d,'yyyy-MM-dd')?'border-primary text-primary bg-primary/10':'border-border')}>{label}</button>)}<Input aria-label="Choose any date" type="date" value={value} onChange={e=>{if(e.target.value)onChange(e.target.value)}} className="h-9 w-auto max-w-full flex-1"/></div>
    <div className="flex items-center justify-between"><button type="button" aria-label="Previous week" className="grid size-10 place-items-center" onClick={()=>setWeek(d=>addDays(d,-7))}><ChevronLeft className="size-4"/></button><span className="text-xs font-medium">{format(week,'MMM yyyy')}{format(week,'MMM yyyy')!==format(addDays(week,6),'MMM yyyy')?' – '+format(addDays(week,6),'MMM yyyy'):''}</span><button type="button" aria-label="Next week" className="grid size-10 place-items-center" onClick={()=>setWeek(d=>addDays(d,7))}><ChevronRight className="size-4"/></button></div>
    <div className="grid grid-cols-7 gap-1">{Array.from({length:7},(_,i)=>addDays(week,i)).map(d=>{const key=format(d,'yyyy-MM-dd');return <button type="button" key={key} aria-pressed={value===key} onClick={()=>pick(d)} className={'flex min-h-12 flex-col items-center justify-center rounded-lg text-sm '+(value===key?'bg-primary text-primary-foreground':'hover:bg-muted')}><span className="text-[10px]">{format(d,'EEE')}</span><span>{format(d,'d')}</span></button>})}</div>
  </div>;
}
