import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  LayoutDashboard,
  Receipt,
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

function isNavItemActive(pathname, item) {
  if (item.exact) return pathname === item.path;

  return item.matches.some((path) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="absolute inset-0 app-bottom-nav-backdrop" />

      <div
        className="
          relative mx-auto mb-2 mt-2
          grid h-[4.35rem] max-w-3xl grid-cols-5
          overflow-hidden
          app-bottom-nav
          px-1.5 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-1.5
        "
      >
        {navItems.map((item) => {
          const isActive = isNavItemActive(location.pathname, item);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex min-w-0 items-center justify-center rounded-2xl"
            >
              <div
                className={cn(
                  `
                  relative z-10 flex min-w-0 flex-col items-center justify-center
                  gap-1 rounded-2xl px-1 py-1.5 text-center
                  transition-colors duration-200
                  `,
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.08 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="relative flex h-9 w-9 items-center justify-center"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-icon-highlight"
                      className="absolute inset-0 rounded-2xl bg-primary/12 shadow-[0_8px_22px_hsl(var(--primary)/0.16)] ring-1 ring-primary/15"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  <Icon
                    className={cn(
                      'relative z-10 h-5 w-5 transition-all duration-200',
                      isActive && 'stroke-[2.5]'
                    )}
                  />
                </motion.div>

                <motion.span
                  animate={{ opacity: isActive ? 1 : 0.68 }}
                  className={cn(
                    'block max-w-full truncate text-[10px] leading-none transition-all duration-200 sm:text-[11px]',
                    isActive ? 'font-semibold' : 'font-medium'
                  )}
                >
                  {item.label}
                </motion.span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
