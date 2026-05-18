import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChartPie,
  CalendarCheck,
  Receipt,
  WalletCards,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/reflect', icon: ChartPie, label: 'Reflect', matches: ['/reflect'] },
  { path: '/', icon: CalendarCheck, label: 'Plan', matches: ['/', '/plan', '/edit-plan'] },
  {
    path: '/transactions',
    icon: Receipt,
    label: 'Transactions',
    matches: ['/transactions', '/add-transaction'],
  },
  {
    path: '/accounts',
    icon: WalletCards,
    label: 'Accounts',
    matches: ['/accounts', '/add-account'],
  },
  { path: '/settings', icon: Settings, label: 'Settings', matches: ['/settings', '/categories'] },
];

function isNavItemActive(pathname, item) {
  return item.matches.some((path) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside
      className="
        hidden lg:flex lg:static
        h-full w-64 flex-col
        app-fixed-surface
        border-0 shadow-none ring-0
      "
    >
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-xl surface-card card-elevated ring-1 ring-white/40 dark:ring-white/[0.05]">
            <img
              src="/icon-192.png"
              alt="Cero"
              className="h-full w-full object-contain p-1"
            />
          </div>

          <span className="text-lg font-bold leading-none tracking-tight">
            Cero
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = isNavItemActive(location.pathname, item);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive ? 'page' : undefined}
              className="relative block"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-primary/[0.08]"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}

              <div
                className={cn(
                  `
                  relative z-10
                  flex h-11 items-center gap-3
                  rounded-xl px-3
                  text-sm font-medium
                  transition-colors duration-200
                  `,
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-line"
                    className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  />
                )}

                <Icon
                  className={cn(
                    'h-5 w-5 transition-all duration-200',
                    isActive && 'stroke-[2.5]'
                  )}
                />

                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4">
        <div className="text-center text-xs text-muted-foreground">
          Zero-Based Budgeting
        </div>
      </div>
    </aside>
  );
}
