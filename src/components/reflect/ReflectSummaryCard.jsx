import { cn } from '@/lib/utils';
import ReflectCard from './ReflectCard.jsx';

export function CurrencyAmount({ amount }) {
  return <span>{Number(amount || 0).toLocaleString()}</span>;
}

export function InlineMoney({ children }) {
  return <span className='inline-flex items-center whitespace-nowrap'>{children}</span>;
}

export function formatCurrencyText(value) {
  return Number(value || 0).toLocaleString();
}

export default function ReflectSummaryCard({ title, value, subtitle, icon: Icon, tone = 'default' }) {
  const toneClass = tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-red-700' : 'text-foreground';

  return (
    <ReflectCard className='relative min-h-[112px] overflow-hidden p-4'>
      <div className='relative flex h-full items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <p className='mb-2 text-xs leading-none text-muted-foreground'>{title}</p>
          <div className={cn('text-xl font-bold', toneClass)}>{value}</div>
          {subtitle && <div className='mt-2 text-[11px] text-muted-foreground'>{subtitle}</div>}
        </div>
        <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-background/70'>
          <Icon className={cn('h-4 w-4', toneClass)} />
        </div>
      </div>
    </ReflectCard>
  );
}
