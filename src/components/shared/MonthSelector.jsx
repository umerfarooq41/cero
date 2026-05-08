import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths } from 'date-fns';

export default function MonthSelector({ currentMonth, onChange }) {
  const date = new Date(currentMonth + '-01');

  return (
    <div className="flex items-center gap-1 rounded-2xl bg-secondary/70 p-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 rounded-xl"
        onClick={() => onChange(format(subMonths(date, 1), 'yyyy-MM'))}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="hidden min-w-[7.25rem] text-center text-sm font-semibold sm:inline">
        {format(date, 'MMMM yyyy')}
      </span>
      <span className="min-w-[4.9rem] text-center text-xs font-semibold sm:hidden">
        {format(date, 'MMM yyyy')}
      </span>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 rounded-xl"
        onClick={() => onChange(format(addMonths(date, 1), 'yyyy-MM'))}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
