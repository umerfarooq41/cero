import { CalendarClock } from 'lucide-react';

import EmptyState from '@/components/shared/EmptyState';

export default function ScheduledTransactions() {
  return (
    <div className="animate-child">
      <EmptyState
        icon={CalendarClock}
        title="Scheduled execution is next"
        description="Recurring bills, recurring income, and savings goal contributions will be handled here next."
      />
    </div>
  );
}
