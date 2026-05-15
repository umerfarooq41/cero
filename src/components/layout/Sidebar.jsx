import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
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

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="
        hidden lg:flex lg:static
        h-full w-64 lg:w-72 flex-col
        app-fixed-surface
        border-0
        shadow-none
        ring-0
      "
    >
      <div className="flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-card/90 shadow-sm ring-1 ring-border/50">
            <img
              src="/icon-192.png"
              alt="Cero"
              className="w-full h-full object-contain p-1"
            />
          </div>

          <span className="font-semibold text-lg tracking-tight leading-none">
            Cero
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 lg:px-4 lg:py-3 rounded-xl text-sm lg:text-[15px] font-medium transition-all duration-150',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'w-[18px] h-[18px] lg:w-5 lg:h-5 transition-all duration-150',
                  isActive && 'stroke-[2.5]'
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4">
        <div className="text-xs text-muted-foreground text-center">
          Zero-Based Budgeting
        </div>
      </div>
    </aside>
  );
}