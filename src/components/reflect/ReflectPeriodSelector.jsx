import { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import ReflectCard from './ReflectCard.jsx';

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
  onYearChange,
  onMonthChange,
}) {
  const [periodMode, setPeriodMode] = useState(
    month === 'all' ? 'year' : 'month'
  );

  const currentYear = new Date().getFullYear();

  const years = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) =>
        String(currentYear - 4 + index)
      ),
    [currentYear]
  );

  useEffect(() => {
    if (periodMode === 'year' && month !== 'all') {
      onMonthChange('all');
    }

    if (periodMode === 'month' && month === 'all') {
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      onMonthChange(currentMonth);
    }
  }, [periodMode, month, onMonthChange]);

  const selectedMonth =
    MONTHS.find((item) => item.value === month) ||
    MONTHS[new Date().getMonth()];

  const heading =
    periodMode === 'year'
      ? `Year ${year}`
      : `${selectedMonth.label} ${year}`;

  return (
    <ReflectCard className="mb-4 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
  <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
    <CalendarDays className="h-4 w-4 text-muted-foreground" />
    <span>Reporting Period</span>
  </h3>

  <h3 className="shrink-0 text-sm font-semibold">
    {heading}
  </h3>
</div>

      <div className="mb-3 grid grid-cols-2 rounded-2xl border border-border/60 bg-card/60 p-1 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setPeriodMode('month')}
          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
            periodMode === 'month'
              ? 'bg-card/90 text-foreground shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          Month
        </button>

        <button
          type="button"
          onClick={() => setPeriodMode('year')}
          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
            periodMode === 'year'
              ? 'bg-card/90 text-foreground shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          Year
        </button>
      </div>

      <div
        className={
          periodMode === 'month'
            ? 'grid grid-cols-2 gap-3'
            : 'grid grid-cols-1 gap-3'
        }
      >
        <Select value={String(year)} onValueChange={onYearChange}>
          <SelectTrigger className="h-11 rounded-2xl border-border/60 bg-card/70 backdrop-blur-xl">
            <SelectValue placeholder="Year" />
          </SelectTrigger>

          <SelectContent>
            {years.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {periodMode === 'month' && (
          <Select
            value={month === 'all' ? selectedMonth.value : month}
            onValueChange={onMonthChange}
          >
            <SelectTrigger className="h-11 rounded-2xl border-border/60 bg-card/70 backdrop-blur-xl">
              <SelectValue placeholder="Month" />
            </SelectTrigger>

            <SelectContent>
              {MONTHS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </ReflectCard>
  );
}