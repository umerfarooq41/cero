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
          --app-bottom-nav-extra: 8px;
          --app-bottom-nav-height: calc(4.75rem + var(--app-safe-area-bottom) + var(--app-bottom-nav-extra));
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
          padding-bottom: calc(var(--app-safe-area-bottom) + var(--app-bottom-nav-extra));
          border: 0 !important;
          border-top: 0 !important;
          border-bottom: 0 !important;
          outline: 0 !important;

          background: var(--app-page-gradient) !important;
          background-attachment: fixed !important;

          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          transform: translateZ(0);
        }

        html.dark .app-bottom-nav {
          background: var(--app-page-gradient) !important;
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
        <div className="relative mx-auto grid h-full w-full max-w-3xl grid-cols-5">
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
                    gap-1 px-0.5 py-1 text-center
                    transition-colors duration-200
                    `,
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.04 : 1,
                      y: isActive ? -1 : 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                    className="relative flex h-9 w-9 items-center justify-center"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-icon-highlight"
                        className="
                          absolute inset-0 rounded-full
                          bg-primary/10
                          ring-1 ring-primary/25
                          shadow-[0_0_22px_hsl(var(--primary)/0.20)]
                        "
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}

                    <Icon
                      className={cn(
                        'relative z-10 h-5 w-5 transition-all duration-200',
                        isActive
                          ? 'text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.55)] stroke-[2.5]'
                          : 'text-muted-foreground/80 stroke-[2.35]'
                      )}
                    />
                  </motion.div>

                  <motion.span
                    animate={{ opacity: isActive ? 1 : 0.66 }}
                    className={cn(
                      'block max-w-full whitespace-nowrap text-[10px] leading-none transition-all duration-200',
                      isActive
                        ? 'font-bold text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.30)]'
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