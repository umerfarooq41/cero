import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths } from 'date-fns';
import { motion } from 'framer-motion';

export default function MonthSelector({ currentMonth, onChange }) {
  const date = new Date(`${currentMonth}-01`);

  const goToPreviousMonth = () => {
    onChange(format(subMonths(date, 1), 'yyyy-MM'));
  };

  const goToNextMonth = () => {
    onChange(format(addMonths(date, 1), 'yyyy-MM'));
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragEnd={(_, info) => {
        if (info.offset.x < -40) goToNextMonth();
        if (info.offset.x > 40) goToPreviousMonth();
      }}
      className="flex touch-pan-y select-none items-center gap-2"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={goToPreviousMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <motion.span
        key={currentMonth}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="min-w-[120px] text-center text-sm font-semibold text-foreground"
      >
        {format(date, 'MMMM yyyy')}
      </motion.span>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={goToNextMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}