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
                className="relative flex min-w-0 items-center justify-center"
              >
                <div
                  className={cn(
                    'relative flex min-w-0 flex-col items-center justify-center gap-1 text-center transition-colors duration-200',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground/75 hover:text-foreground'
                  )}
                >
                  <motion.span
                    layout
                    animate={{ opacity: isActive ? 1 : 0, scaleX: isActive ? 1 : 0.55 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute -top-1 h-0.5 w-6 rounded-full bg-primary"
                  />

                  <motion.div
                    animate={{ scale: isActive ? 1.05 : 1, y: isActive ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                    className="flex h-7 w-7 items-center justify-center"
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-all duration-200',
                        isActive
                          ? 'text-primary stroke-[2.55]'
                          : 'text-muted-foreground/80 stroke-[2.25]'
                      )}
                    />
                  </motion.div>

                  <motion.span
                    animate={{ opacity: isActive ? 1 : 0.7 }}
                    className={cn(
                      'block max-w-full whitespace-nowrap text-[10px] leading-none transition-all duration-200',
                      isActive
                        ? 'font-bold text-primary'
                        : 'font-medium text-muted-foreground'
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
    </>
  );
}
