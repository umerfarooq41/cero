import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChartPie,
  CalendarCheck,
  LayoutDashboard,
  Receipt,
  Settings,
  Tags,
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
    path: '/reflect',
    icon: ChartPie,
    label: 'Reflect',
    matches: ['/reflect'],
  },
];

const utilityItems = [
  {
    path: '/categories',
    icon: Tags,
    label: 'Categories',
    matches: ['/categories'],
  },
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
      className="relative block"
    >
      {isActive && !compact && (
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
          flex items-center gap-3
          rounded-xl px-3
          text-sm font-medium
          transition-colors duration-200
          `,
          compact ? 'h-10' : 'h-11',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {isActive && !compact && (
          <motion.div
            layoutId="sidebar-line"
            className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-primary"
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          />
        )}

        <Icon
          className={cn(
            compact ? 'h-4 w-4' : 'h-5 w-5',
            'transition-all duration-200',
            isActive && 'stroke-[2.5]'
          )}
        />

        <span>{item.label}</span>
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
        app-fixed-surface
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

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <SidebarLink key={item.path} item={item} />
        ))}
      </nav>

      <div className="space-y-2 px-3 pb-4">
        <div className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
          Manage
        </div>

        <div className="space-y-1">
          {utilityItems.map((item) => (
            <SidebarLink key={item.path} item={item} compact />
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="text-center text-xs text-muted-foreground">
          Zero-Based Budgeting
        </div>
      </div>
    </aside>
  );
}
