import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import ReflectCard from './ReflectCard';

const MONTHS = [
  { value: 'all', label: 'All' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export default function ReflectPeriodSelector({
  year,
  month,
  onYearChange,
  onMonthChange,
}) {
  const currentYear = new Date().getFullYear();

  const years = Array.from({ length: 9 }, (_, index) =>
    String(currentYear - 4 + index)
  );

  const moveYear = (direction) => {
    onYearChange(String(Number(year) + direction));
  };

  return (
    <ReflectCard className="mb-4 p-4">
      <div className="mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Reporting Period
        </p>

        <h2 className="mt-1 text-lg font-bold tracking-tight">
          {month === 'all'
            ? `${year} full year`
            : `${MONTHS.find((item) => item.value === month)?.label} ${year}`}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl"
          onClick={() => moveYear(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Select value={String(year)} onValueChange={onYearChange}>
          <SelectTrigger className="h-10 flex-1 rounded-xl">
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

        <Select value={month} onValueChange={onMonthChange}>
          <SelectTrigger className="h-10 flex-1 rounded-xl">
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

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl"
          onClick={() => moveYear(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </ReflectCard>
  );
}