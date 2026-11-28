import { Link, useLocation } from 'react-router-dom';
import { CalendarCheck, LayoutDashboard, Receipt, Settings, SlidersHorizontal, WalletCards } from 'lucide-react';
import Logo from '@/components/Logo';
import { cn } from '@/lib/utils';

const items = [
  ['/', 'Dashboard', LayoutDashboard, ['/']],
  ['/plan', 'Plan', CalendarCheck, ['/plan', '/edit-plan']],
  ['/transactions', 'Transactions', Receipt, ['/transactions', '/add-transaction']],
  ['/accounts', 'Accounts', WalletCards, ['/accounts', '/add-account']],
  ['/manage-plan', 'Workplace', SlidersHorizontal, ['/manage-plan', '/categories']],
  ['/settings', 'Settings', Settings, ['/settings']],
];

export default function DesktopTopNav() {
  const { pathname } = useLocation();
  return (
    <aside className="hidden h-full w-[72px] shrink-0 flex-col border-r border-border bg-card md:flex workspace:w-[220px] xl:w-[240px]">
      <Link to="/" aria-label="Cero dashboard" className="flex items-center justify-center gap-3 px-2 py-7 workspace:justify-start workspace:px-5">
        <Logo size={40} priority />
        <div className="hidden workspace:block"><div className="text-[22px] font-semibold tracking-tight">Cero</div><div className="text-xs text-muted-foreground">Zero-based budgeting</div></div>
      </Link>
      <nav aria-label="Main navigation" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4 workspace:px-3">
        {items.map(([path, label, Icon, matches]) => {
          const active = matches.some(match => pathname === match || (match !== '/' && pathname.startsWith(match + '/')));
          return <Link key={path} to={path} aria-label={label} title={label} aria-current={active ? 'page' : undefined} className={cn('cero-desktop-nav-link flex min-h-[46px] shrink-0 items-center justify-center gap-3 rounded-md px-2 workspace:justify-start workspace:px-3 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0', path === '/settings' && 'mt-auto', active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}><Icon className="size-5 shrink-0" aria-hidden="true"/><span className="hidden workspace:inline">{label}</span></Link>;
        })}
      </nav>
    </aside>
  );
}
