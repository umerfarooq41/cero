import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  Landmark,
  Settings,
  Target,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/accounts', label: 'Accounts', icon: Landmark, match: ['/accounts', '/add-account'] },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight, match: ['/transactions', '/add-transaction'] },
  { path: '/reflect', label: 'Reflect', icon: BarChart3, match: ['/', '/reflect'] },
  { path: '/budget', label: 'Budget', icon: Target, match: ['/budget', '/plan'] },
  { path: '/settings', label: 'Settings', icon: Settings, match: ['/settings'] },
];

function isActivePath(pathname, item) {
  return item.match.some((path) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 safe-bottom"
      aria-label="Primary navigation"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="mx-auto w-full max-w-3xl px-3">
        <div className="material-nav no-touch-callout grid h-[5.25rem] grid-cols-5 rounded-t-[1.75rem] px-2 py-2 sm:mb-3 sm:rounded-[1.75rem]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(location.pathname, item);
            const isCenter = item.label === 'Reflect';

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className="touch-manipulation"
                draggable={false}
              >
                <span
                  className={cn(
                    'relative flex h-full flex-col items-center justify-center gap-1 rounded-[1.4rem] text-[11px] font-medium text-muted-foreground transition-colors',
                    active && 'text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'relative flex h-8 min-w-12 items-center justify-center rounded-full px-4 transition-colors',
                      active && 'bg-primary/[0.14] text-primary dark:bg-primary/[0.22]',
                      active && isCenter && 'bg-primary text-primary-foreground shadow-sm',
                      !active && isCenter && 'bg-secondary text-secondary-foreground'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="m3-nav-indicator"
                        className={cn(
                          'absolute inset-0 rounded-full',
                          isCenter ? 'bg-primary' : 'bg-primary/[0.14] dark:bg-primary/[0.22]'
                        )}
                        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Icon className="relative h-5 w-5" />
                  </span>

                  <span className={cn('leading-none', active && 'font-semibold')}>
                    {item.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
