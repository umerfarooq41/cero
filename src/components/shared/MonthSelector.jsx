import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths } from 'date-fns';

export default function MonthSelector({ currentMonth, onChange }) {
  const date = new Date(currentMonth + '-01');

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={() => onChange(format(subMonths(date, 1), 'yyyy-MM'))}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm font-semibold min-w-[120px] text-center">
        {format(date, 'MMMM yyyy')}
      </span>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8"
        onClick={() => onChange(format(addMonths(date, 1), 'yyyy-MM'))}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}