import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReflectCard from './ReflectCard.jsx';

export default function ReflectPeriodSelector({ year, month, onYearChange, onMonthChange }) {
  return (
    <ReflectCard className='mb-4 p-4'>
      <div className='flex items-center gap-2'>
        <Button type='button' variant='secondary' size='icon'>
          <ChevronLeft className='h-4 w-4' />
        </Button>

        <Select value={String(year)} onValueChange={onYearChange}>
          <SelectTrigger className='h-10 flex-1 rounded-xl'>
            <SelectValue placeholder='Year' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='2025'>2025</SelectItem>
            <SelectItem value='2026'>2026</SelectItem>
          </SelectContent>
        </Select>

        <Select value={month} onValueChange={onMonthChange}>
          <SelectTrigger className='h-10 flex-1 rounded-xl'>
            <SelectValue placeholder='Month' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All</SelectItem>
            <SelectItem value='01'>January</SelectItem>
            <SelectItem value='02'>February</SelectItem>
          </SelectContent>
        </Select>

        <Button type='button' variant='secondary' size='icon'>
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    </ReflectCard>
  );
}
