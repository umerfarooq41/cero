import PlanMoney from './PlanMoney';
import { PLAN_TABS } from './planTabsConfig';
import CategoryIcon from '@/components/shared/CategoryIcon';
import SourceBadge from '@/components/shared/SourceBadge';

export default function DesktopPlanWorksheet({ activeTab, setActiveTab, tab, planData, currency }) {
  const { chartData, totalPlanned, totalTracked, totalRemaining, progress } = planData;
  const money = (amount) => <PlanMoney amount={amount} currency={currency}/>;
  const signed = (amount) => <>{amount < 0 ? '−' : ''}{money(Math.abs(amount))}</>;
  return <section className="min-w-0">
    <nav aria-label="Budget types" className="flex gap-5 border-b border-border">
      {PLAN_TABS.map(item => <button key={item.key} type="button" aria-pressed={activeTab === item.key} onClick={() => setActiveTab(item.key)} className={'border-b-2 px-2 py-3 text-sm font-medium ' + (activeTab === item.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>{item.title}</button>)}
    </nav>
    <div className="grid grid-cols-3 gap-4 border-b border-border py-5">
      {[['Planned',totalPlanned],['Tracked',totalTracked],['Remaining',totalRemaining]].map(([label,value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className={'mt-1 text-2xl font-semibold ' + (label === 'Remaining' && value < 0 ? 'text-destructive' : '')}>{signed(value)}</p></div>)}
    </div>
    <div className="overflow-auto max-h-[65vh]">
      <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-0 text-sm">
        <caption className="sr-only">{tab.title} budget worksheet</caption>
        <colgroup><col style={{width:"32%"}}/><col style={{width:"16%"}}/><col style={{width:"16%"}}/><col style={{width:"16%"}}/><col style={{width:"20%"}}/></colgroup><thead className="sticky top-0 z-10 bg-card text-xs text-muted-foreground"><tr>
          <th scope="col" className="px-3 py-3 text-left font-medium">Category</th>
          <th scope="col" className="px-3 py-3 text-right font-medium">Planned</th>
          <th scope="col" className="px-3 py-3 text-right font-medium">Tracked</th>
          <th scope="col" className="px-3 py-3 text-right font-medium">Remaining</th>
          <th scope="col" className="px-3 py-3 text-left font-medium">Progress</th>
        </tr></thead>
        <tbody className="divide-y divide-border">
          {chartData.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">No {tab.title.toLowerCase()} data yet</td></tr>}
          {chartData.map(item => {
            const planned = Number(item.planned || 0), tracked = Number(item.tracked || 0);
            const remaining = planned - tracked;
            const percent = planned > 0 ? tracked / planned * 100 : tracked > 0 ? 100 : 0;
            const over = activeTab === 'expense' && tracked > planned;
            return <tr key={item.id} className="hover:bg-muted/30">
              <th scope="row" className="px-3 py-3 text-left font-medium"><div className="flex items-center gap-2"><CategoryIcon icon={item.icon || item.category?.icon} color={item.categoryColor || item.color} size="sm"/><span className="break-words">{item.name}</span><SourceBadge type={item.sourceType} tone={item.sourceType === 'goal' ? 'savings' : activeTab}/></div></th>
              <td className="px-3 py-3 text-right">{signed(planned)}</td><td className="px-3 py-3 text-right">{signed(tracked)}</td><td className={'px-3 py-3 text-right ' + (over ? 'text-destructive' : '')}>{signed(remaining)}</td>
              <td className="px-3 py-3"><div className="flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className={'h-full rounded-full ' + (over ? 'bg-destructive' : 'bg-primary')} style={{width: Math.max(0,Math.min(100,percent)) + '%'}}/></div><span className="shrink-0 text-xs tabular-nums">{planned <= 0 && tracked > 0 ? "Unbudgeted" : `${Math.round(percent)}%`}</span></div></td>
            </tr>;
          })}
        </tbody>
        <tfoot className="border-y border-border bg-muted/30 font-semibold"><tr><th scope="row" className="px-3 py-3 text-left">Total</th><td className="px-3 py-3 text-right">{signed(totalPlanned)}</td><td className="px-3 py-3 text-right">{signed(totalTracked)}</td><td className="px-3 py-3 text-right">{signed(totalRemaining)}</td><td className="px-3 py-3">{totalPlanned <= 0 && totalTracked > 0 ? "Unbudgeted" : `${Math.round(progress)}%`}</td></tr></tfoot>
      </table>
    </div>
  </section>;
}
