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

function WebsiteNavLink({ item, pathname }) {
  const isActive = isNavItemActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      data-haptic="true"
      className={cn(
        'group relative inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground/82 hover:text-foreground'
      )}
    >
      {isActive ? (
        <motion.span
          layoutId="website-nav-active-pill"
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-primary/10 ring-1 ring-primary/18"
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        />
      ) : null}

      <Icon
        className={cn(
          'relative z-10 h-4 w-4 transition-all duration-200',
          isActive
            ? 'text-primary stroke-[2.6]'
            : 'text-muted-foreground/78 stroke-[2.25] group-hover:text-foreground'
        )}
      />

      <span className="relative z-10 whitespace-nowrap">{item.label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const settingsActive = isNavItemActive(location.pathname, settingsItem);

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
            <WebsiteNavLink key={item.path} item={item} pathname={location.pathname} />
          ))}
        </nav>

        <Link
          to="/settings"
          aria-label="Open settings"
          aria-current={settingsActive ? 'page' : undefined}
          data-haptic="true"
          className={cn(
            'inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            settingsActive
              ? 'bg-primary/10 text-primary ring-1 ring-primary/18'
              : 'text-muted-foreground/82 hover:bg-foreground/[0.04] hover:text-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </header>
  );
}
