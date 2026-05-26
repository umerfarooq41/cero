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
import './bottomnav.css';

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
    <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-50 lg:hidden">
      <div className="mx-auto grid h-full w-full max-w-3xl grid-cols-5">
        {navItems.map((item) => {
          const isActive = isNavItemActive(location.pathname, item);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex min-w-0 items-center justify-center"
            >
              <div
                className={cn(
                  `
                  relative z-10 flex min-w-0 flex-col items-center justify-center
                  gap-1 px-1 pt-2 text-center
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
                  className="relative flex h-11 w-11 items-center justify-center"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-icon-highlight"
                      className="app-bottom-nav-active-icon absolute inset-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}

                  <Icon
                    className={cn(
                      'relative z-10 h-5 w-5 transition-all duration-200',
                      isActive && 'app-bottom-nav-active-icon-svg stroke-[2.5]'
                    )}
                  />
                </motion.div>

                <motion.span
                  animate={{ opacity: isActive ? 1 : 0.62 }}
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
