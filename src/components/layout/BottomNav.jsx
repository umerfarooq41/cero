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
          --app-bottom-nav-height: calc(4.75rem + var(--app-safe-area-bottom));
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

          background:
            radial-gradient(circle at 9% 0%, hsl(var(--primary) / 0.16), transparent 34%),
            radial-gradient(circle at 92% 0%, hsl(var(--primary) / 0.08), transparent 36%),
            linear-gradient(to bottom, hsl(var(--card) / 0.94), hsl(var(--card) / 0.98)) !important;

          box-shadow:
            inset 0 1px 0 hsl(var(--app-card-highlight-color, 0 0% 100%) / 0.08) !important;

          backdrop-filter: blur(18px) saturate(145%);
          -webkit-backdrop-filter: blur(18px) saturate(145%);
        }

        html.dark .app-bottom-nav {
          background:
            radial-gradient(circle at 9% 0%, hsl(var(--primary) / 0.16), transparent 34%),
            radial-gradient(circle at 92% 0%, hsl(var(--primary) / 0.08), transparent 36%),
            linear-gradient(to bottom, hsl(var(--card) / 0.92), hsl(var(--card) / 0.98)) !important;

          box-shadow:
            inset 0 1px 0 hsl(0 0% 100% / 0.05) !important;

          backdrop-filter: blur(18px) saturate(140%);
          -webkit-backdrop-filter: blur(18px) saturate(140%);
        }

        .app-bottom-nav-active-icon {
          background:
            radial-gradient(circle at 35% 25%, hsl(var(--primary) / 0.30), transparent 42%),
            hsl(var(--primary) / 0.10);

          color: hsl(var(--primary));

          box-shadow:
            0 0 0 1px hsl(var(--primary) / 0.20),
            0 10px 28px hsl(var(--primary) / 0.20);
        }

        html.dark .app-bottom-nav-active-icon {
          background:
            radial-gradient(circle at 35% 25%, hsl(var(--primary) / 0.28), transparent 42%),
            hsl(var(--primary) / 0.12);

          box-shadow:
            0 0 0 1px hsl(var(--primary) / 0.18),
            0 10px 28px hsl(var(--primary) / 0.18);
        }

        .app-bottom-nav-active-label {
          color: hsl(var(--primary));
        }

        .app-bottom-nav-inactive-label {
          color: hsl(var(--muted-foreground));
        }

        .app-bottom-nav-inactive-icon {
          color: hsl(var(--muted-foreground));
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
                    gap-1 px-1 py-1.5 text-center
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
                    className="relative flex h-10 w-10 items-center justify-center"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-icon-highlight"
                        className="app-bottom-nav-active-icon absolute inset-0 rounded-2xl"
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
                          ? 'drop-shadow-[0_0_10px_hsl(var(--primary)/0.55)] stroke-[2.5]'
                          : 'app-bottom-nav-inactive-icon'
                      )}
                    />
                  </motion.div>

                  <motion.span
                    animate={{ opacity: isActive ? 1 : 0.62 }}
                    className={cn(
                      'block max-w-full truncate text-[10px] leading-none transition-all duration-200 sm:text-[11px]',
                      isActive
                        ? 'app-bottom-nav-active-label font-semibold'
                        : 'app-bottom-nav-inactive-label font-medium'
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