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
  { path: '/reflect', icon: ChartPie, label: 'Reflect' },
  { path: '/', icon: CalendarCheck, label: 'Plan' },
  { path: '/transactions', icon: Receipt, label: 'Transactions' },
  { path: '/accounts', icon: WalletCards, label: 'Accounts' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

function isNavItemActive(pathname, path) {
  if (path === '/') {
    return (
      pathname === '/' ||
      pathname.startsWith('/plan') ||
      pathname.startsWith('/edit-plan')
    );
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Backdrop blur panel */}
      <div className="absolute inset-0 app-fixed-surface app-bottom-nav" />

      <div
        className="
          relative mx-auto
          grid h-16 max-w-3xl grid-cols-5
          pb-[env(safe-area-inset-bottom)]
        "
      >
        {navItems.map((item) => {
          const isActive = isNavItemActive(location.pathname, item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className="relative flex items-center justify-center"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="
                    absolute inset-x-2 inset-y-1.5
                    rounded-2xl
                    bg-primary/10
                  "
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}

              <div
                className={cn(
                  `
                  relative z-10
                  flex flex-col items-center justify-center
                  gap-1 px-2 py-2
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
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  }}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      isActive && 'stroke-[2.5]'
                    )}
                  />
                </motion.div>

                <motion.span
                  animate={{
                    opacity: isActive ? 1 : 0.6,
                  }}
                  className={cn(
                    'text-[11px] transition-all duration-200',
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