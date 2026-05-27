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
    label: 'Manage',
    matches: ['/manage-plan', '/categories'],
  },
];

const settingsItem = {
  path: '/settings',
  icon: Settings,
  label: 'Settings',
  matches: ['/settings'],
};

function isNavItemActive(pathname, item) {
  if (item.exact) return pathname === item.path;

  return item.matches.some((path) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

function SidebarLink({ item, pathname }) {
  const isActive = isNavItemActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      data-haptic="true"
      className={cn(
        'group relative flex touch-manipulation items-center rounded-2xl px-3 py-2 transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive ? 'text-primary' : 'text-muted-foreground/80 hover:text-foreground'
      )}
    >
      <motion.div
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 520, damping: 30 }}
        className="relative flex min-w-0 items-center gap-3"
      >
        <motion.span
          animate={{ scale: isActive ? 1.04 : 1, x: isActive ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 430, damping: 28 }}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        >
          {isActive && (
            <motion.span
              layoutId="sidebar-nav-active-orb"
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-primary/10 ring-1 ring-primary/35"
              style={{
                boxShadow:
                  '0 0 0 1px hsl(var(--primary) / 0.18), 0 0 24px hsl(var(--primary) / 0.28), inset 0 1px 0 hsl(var(--foreground) / 0.08)',
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            />
          )}

          {isActive && (
            <motion.span
              aria-hidden="true"
              className="absolute -inset-2 rounded-full bg-primary/15 blur-xl"
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.75 }}
              transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            />
          )}

          <Icon
            className={cn(
              'relative z-10 h-5 w-5 transition-all duration-200',
              isActive
                ? 'text-primary stroke-[2.65]'
                : 'text-muted-foreground/80 stroke-[2.25] group-hover:text-foreground'
            )}
          />
        </motion.span>

        <motion.span
          animate={{ opacity: isActive ? 1 : 0.72, x: isActive ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className={cn(
            'truncate text-sm leading-none transition-all duration-200',
            isActive ? 'font-bold text-primary' : 'font-medium text-muted-foreground'
          )}
        >
          {item.label}
        </motion.span>
      </motion.div>
    </Link>
  );
}

export default function Sidebar() {
  const location = useLocation();

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
        <Link to="/" className="flex items-center gap-3" data-haptic="true">
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
          <SidebarLink key={item.path} item={item} pathname={location.pathname} />
        ))}
      </nav>

      <div className="px-4 pb-3">
        <div className="text-center text-xs text-muted-foreground/70">
          Zero-Based Budgeting
        </div>
      </div>

      <nav className="px-3 pb-4">
        <SidebarLink item={settingsItem} pathname={location.pathname} />
      </nav>
    </aside>
  );
}
