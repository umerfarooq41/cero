import { cn } from '@/lib/utils';
import ReflectCard from './ReflectCard.jsx';

export default function ReflectInsightCard({ icon: Icon, title, text, tone = 'default' }) {
  const toneClass = tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-destructive' : 'text-primary';

  return (
    <ReflectCard className='overflow-hidden p-4'>
      <div className='flex gap-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10'>
          <Icon className={cn('h-4 w-4', toneClass)} />
        </div>

        <div className='min-w-0'>
          <p className='text-sm font-semibold'>{title}</p>
          <p className='mt-1 text-xs leading-relaxed text-muted-foreground'>{text}</p>
        </div>
      </div>
    </ReflectCard>
  );
}
