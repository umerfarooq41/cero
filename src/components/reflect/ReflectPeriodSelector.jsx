import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';




const MONTHS = [
  { value: '01', label: 'January', shortLabel: 'Jan' },
  { value: '02', label: 'February', shortLabel: 'Feb' },
  { value: '03', label: 'March', shortLabel: 'Mar' },
  { value: '04', label: 'April', shortLabel: 'Apr' },
  { value: '05', label: 'May', shortLabel: 'May' },
  { value: '06', label: 'June', shortLabel: 'Jun' },
  { value: '07', label: 'July', shortLabel: 'Jul' },
  { value: '08', label: 'August', shortLabel: 'Aug' },
  { value: '09', label: 'September', shortLabel: 'Sep' },
  { value: '10', label: 'October', shortLabel: 'Oct' },
  { value: '11', label: 'November', shortLabel: 'Nov' },
  { value: '12', label: 'December', shortLabel: 'Dec' },
];

export default function ReflectPeriodSelector({
  year,
  month,
  periodMode: controlledPeriodMode,
  onPeriodModeChange,
  onYearChange,
  onMonthChange,
}) {
  const [internalPeriodMode, setInternalPeriodMode] = useState(
    month === 'all' ? 'year' : 'month'
  );

  const periodMode = controlledPeriodMode ?? internalPeriodMode;

  const currentYear = new Date().getFullYear();

  const years = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) =>
        String(currentYear - 4 + index)
      ),
    [currentYear]
  );

  const selectedMonth = useMemo(() => {
    return (
      MONTHS.find((item) => item.value === month) ||
      MONTHS[new Date().getMonth()]
    );
  }, [month]);

  const changeMode = (nextMode) => {
    setInternalPeriodMode(nextMode);
    onPeriodModeChange?.(nextMode);
  };


  const monthIndex = Number(selectedMonth.value) - 1;
  const isFuture = (y, m) => Number(y) > currentYear || (Number(y) === currentYear && m > new Date().getMonth());
  const canAdvance = periodMode === 'year' ? Number(year) < currentYear : !isFuture(year, monthIndex + 1);
  const navigate = (delta) => {
    if (periodMode === 'year') {
      const next = Number(year) + delta;
      if (next <= currentYear) onYearChange(String(next));
      return;
    }
    const next = new Date(Number(year), monthIndex + delta, 1);
    if (isFuture(next.getFullYear(), next.getMonth())) return;
    onYearChange(String(next.getFullYear()));
    onMonthChange(String(next.getMonth() + 1).padStart(2, '0'));
  };
  return (
    <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
      <div className="flex items-center rounded-xl bg-muted/60 p-0.5">
        {['month', 'year'].map(mode => <button key={mode} type="button" onClick={() => changeMode(mode)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${periodMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{mode === 'month' ? 'Month' : 'Year'}</button>)}
      </div>
      <div className="flex min-w-0 items-center gap-1">
        <button type="button" aria-label="Previous period" onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60"><ChevronLeft className="h-4 w-4" /></button>
        <Select value={periodMode === 'year' ? String(year) : `${year}-${selectedMonth.value}`}
          onValueChange={value => { if (periodMode === 'year') onYearChange(value); else { const [y,m] = value.split('-'); onYearChange(y); onMonthChange(m); } }}>
          <SelectTrigger aria-label="Select reporting period" className="h-8 w-[110px] rounded-lg border-0 bg-transparent px-1 text-xs font-semibold shadow-none">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            {years.filter(y => Number(y) <= currentYear).flatMap(y => periodMode === 'year'
              ? [<SelectItem key={y} value={y}>{y}</SelectItem>]
              : MONTHS.filter((m,i) => !isFuture(y,i)).map(m => <SelectItem key={`${y}-${m.value}`} value={`${y}-${m.value}`}>{m.shortLabel} {y}</SelectItem>))}
          </SelectContent>
        </Select>
        <button type="button" aria-label="Next period" disabled={!canAdvance} onClick={() => navigate(1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
