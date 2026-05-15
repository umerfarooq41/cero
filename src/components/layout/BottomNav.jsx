import { Link, useLocation } from 'react-router-dom';
import {
  PieChart,
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/reflect', icon: PieChart, label: 'Reflect' },
  { path: '/', icon: LayoutDashboard, label: 'Plan' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/accounts', icon: Wallet, label: 'Accounts' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="grid h-16 grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center justify-center"
            >
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 transition-all duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-all duration-200',
                    isActive && 'scale-110 drop-shadow-sm'
                  )}
                />

                <span className="text-[11px] font-medium leading-none">
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
