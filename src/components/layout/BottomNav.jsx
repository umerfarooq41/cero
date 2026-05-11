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
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-none">
      <div className="px-3 pb-[calc(env(safe-area-inset-bottom)+10px)]">
        <div className="pointer-events-auto grid grid-cols-5 h-16 rounded-3xl border border-border bg-background/95 shadow-lg backdrop-blur-xl">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

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
                    ? 'bg-primary/10 text-primary scale-105'
                    : 'text-muted-foreground'
                )}
            >
                <item.icon
                className={cn(
                    'w-5 h-5 transition-all',
                    isActive && 'scale-110'
                )}
                />

                <span className="text-[11px] font-medium">
                {item.label}
                </span>
            </div>
            </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}