import PlanBreakdownRow from './PlanBreakdownRow';

export default function PlanBreakdownCard({ activeTab, tab, rows, currency }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 app-card-surface shadow-sm backdrop-blur-xl">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-bold uppercase tracking-wide">
          {activeTab === 'savings'
            ? 'Savings & Goals Breakdown'
            : `${tab.title} Breakdown`}
        </h3>
      </div>

      <div className="divide-y divide-border/50">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No {tab.title.toLowerCase()} data yet
          </div>
        ) : (
          rows.map((item) => (
            <PlanBreakdownRow key={item.id} item={item} currency={currency} />
          ))
        )}
      </div>
    </div>
  );
}
