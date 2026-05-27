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

function BottomNavStyles() {
  return (
    <style>
      {`
        html {
          --app-safe-area-bottom: env(safe-area-inset-bottom, 0px);
          --app-bottom-nav-height: calc(4.25rem + var(--app-safe-area-bottom));
        }

        .app-main-scroll {
          padding-bottom: var(--app-bottom-nav-height);
        }

        @media (min-width: 1024px) {
          .app-main-scroll {
            padding-bottom: 0;
          }
        }

        .app-bottom-nav {
          height: var(--app-bottom-nav-height);
          padding-bottom: var(--app-safe-area-bottom);
          border: 0 !important;
          border-top: 0 !important;
          border-bottom: 0 !important;
          outline: 0 !important;
          background-color: var(--app-bg-color, hsl(var(--background))) !important;
          background-image: var(--app-bg-image) !important;
          background-size: cover !important;
          background-position: center !important;
          background-attachment: fixed !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
      `}
    </style>
  );
}

export default function BottomNav() {
  const location = useLocation();

  return (
    <>
      <BottomNavStyles />

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
                data-haptic="true"
                className="group relative flex min-w-0 touch-manipulation items-center justify-center"
              >
                <motion.div
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                  className={cn(
                    'relative flex min-w-0 flex-col items-center justify-center gap-1 text-center transition-colors duration-200',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground/75 hover:text-foreground'
                  )}
                >
                  <motion.div
                    animate={{ scale: isActive ? 1.04 : 1, y: isActive ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 430, damping: 28 }}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full"
                  >
                    {isActive && (
                      <motion.span
                        layoutId="bottom-nav-active-orb"
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
                  </motion.div>

                  <motion.span
                    animate={{ opacity: isActive ? 1 : 0.68, y: isActive ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className={cn(
                      'block max-w-full whitespace-nowrap text-[10px] leading-none transition-all duration-200',
                      isActive
                        ? 'font-bold text-primary'
                        : 'font-medium text-muted-foreground'
                    )}
                  >
                    {item.label}
                  </motion.span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
