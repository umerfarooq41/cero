import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChartPie,
  CalendarCheck,
  LayoutDashboard,
  Receipt,
  WalletCards,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', matches: ['/'] },
  { path: '/plan', icon: CalendarCheck, label: 'Plan', matches: ['/plan', '/edit-plan'] },
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
  { path: '/reflect', icon: ChartPie, label: 'Reflect', matches: ['/reflect'] },
];

function isNavItemActive(pathname, item) {
  return item.matches.some((path) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="absolute inset-0 app-fixed-surface app-bottom-nav" />

      <div
        className="
          relative mx-auto
          grid h-16 max-w-3xl grid-cols-5
          pb-[env(safe-area-inset-bottom)]
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
              className="relative flex items-center justify-center"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="
                    absolute inset-x-2 inset-y-1.5
                    rounded-2xl bg-primary/10
                  "
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <div
                className={cn(
                  `
                  relative z-10
                  flex flex-col items-center justify-center
                  gap-1 px-1.5 py-2
                  transition-colors duration-200
                  `,
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      isActive && 'stroke-[2.5]'
                    )}
                  />
                </motion.div>

                <motion.span
                  animate={{ opacity: isActive ? 1 : 0.6 }}
                  className={cn(
                    'text-[10px] transition-all duration-200 sm:text-[11px]',
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
