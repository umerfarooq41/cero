import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  LayoutDashboard,
  Receipt,
  Settings,
  SlidersHorizontal,
  WalletCards,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    path: '/',
    icon: LayoutDashboard,
    label: 'Dashboard',
    matches: ['/'],
    exact: true,
  },
  {
    path: '/plan',
    icon: CalendarCheck,
    label: 'Plan',
    matches: ['/plan', '/edit-plan'],
  },
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
  {
    path: '/manage-plan',
    icon: SlidersHorizontal,
    label: 'Manage Plan',
    matches: ['/manage-plan', '/categories'],
  },
];

const bottomItems = [
  {
    path: '/settings',
    icon: Settings,
    label: 'Settings',
    matches: ['/settings'],
  },
];

function isNavItemActive(pathname, item) {
  if (item.exact) return pathname === item.path;

  return item.matches.some((path) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

function SidebarLink({ item, compact = false }) {
  const location = useLocation();
  const isActive = isNavItemActive(location.pathname, item);
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      aria-current={isActive ? 'page' : undefined}
      className="group relative block"
    >
      <div
        className={cn(
          `
          relative z-10 flex items-center gap-3 rounded-2xl px-3
          text-sm font-medium transition-colors duration-200
          `,
          compact ? 'h-10' : 'h-11',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <motion.div
          animate={{
            scale: isActive ? 1.06 : 1,
            x: isActive ? 1 : 0,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'relative flex shrink-0 items-center justify-center',
            compact ? 'h-8 w-8' : 'h-9 w-9'
          )}
        >
          {isActive && (
            <motion.div
              layoutId="sidebar-icon-highlight"
              className="absolute inset-0 rounded-2xl bg-primary/10 shadow-sm ring-1 ring-primary/10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}

          <Icon
            className={cn(
              'relative z-10 transition-all duration-200',
              compact ? 'h-4 w-4' : 'h-5 w-5',
              isActive && 'stroke-[2.5]'
            )}
          />
        </motion.div>

        <motion.span
          animate={{ opacity: isActive ? 1 : 0.68 }}
          className={cn(
            'min-w-0 truncate transition-all duration-200',
            isActive ? 'font-semibold' : 'font-medium'
          )}
        >
          {item.label}
        </motion.span>
      </div>
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside
      className="
        hidden lg:flex lg:static
        h-full w-64 flex-col
        app-sidebar-dock
        border-0 shadow-none ring-0
      "
    >
      <div className="flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
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
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {navItems.map((item) => (
          <SidebarLink key={item.path} item={item} />
        ))}
      </nav>

      <div className="space-y-1.5 px-3 pb-4">
        {bottomItems.map((item) => (
          <SidebarLink key={item.path} item={item} compact />
        ))}
      </div>

      <div className="px-4 pb-4">
        <div className="text-center text-xs text-muted-foreground">
          Zero-Based Budgeting
        </div>
      </div>
    </aside>
  );
}
