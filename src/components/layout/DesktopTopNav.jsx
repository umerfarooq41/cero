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
import Logo from '@/components/Logo';
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

function DesktopTopNavLink({ item, pathname }) {
  const isActive = isNavItemActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      data-haptic="true"
      className={cn(
        'group relative inline-flex h-12 touch-manipulation items-center gap-2.5 rounded-2xl px-3 text-sm font-semibold transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive ? 'text-primary' : 'text-muted-foreground/82 hover:text-foreground'
      )}
    >
      <motion.span
        animate={{ scale: isActive ? 1.04 : 1, y: isActive ? -1 : 0 }}
        transition={{ type: 'spring', stiffness: 430, damping: 28 }}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
      >
        {isActive && (
          <motion.span
            layoutId="desktop-top-nav-active-orb"
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
        animate={{ opacity: isActive ? 1 : 0.68, y: isActive ? -1 : 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className={cn(
          'relative z-10 whitespace-nowrap leading-none transition-all duration-200',
          isActive ? 'font-bold text-primary' : 'font-medium text-muted-foreground'
        )}
      >
        {item.label}
      </motion.span>
    </Link>
  );
}

export default function DesktopTopNav() {
  const location = useLocation();

  return (
    <header
      className="
        app-website-header
        hidden h-20 shrink-0 border-0 shadow-none ring-0
        lg:block
      "
    >
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-6 px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3" data-haptic="true">
          <Logo size={38} priority />

          <div className="min-w-0">
            <span className="block text-xl font-bold leading-none tracking-tight text-foreground">
              Cero
            </span>
            <span className="mt-1.5 block truncate text-xs font-semibold leading-none text-muted-foreground/72">
              Zero-based budgeting
            </span>
          </div>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
          {navItems.map((item) => (
            <DesktopTopNavLink key={item.path} item={item} pathname={location.pathname} />
          ))}
        </nav>

        <nav className="flex shrink-0 items-center">
          <DesktopTopNavLink item={settingsItem} pathname={location.pathname} />
        </nav>
      </div>
    </header>
  );
}
