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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 safe-bottom"
      aria-label="Primary navigation"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="pointer-events-auto mica no-touch-callout flex w-full max-w-[32rem] items-end justify-between rounded-[2rem] px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(location.pathname, item);
          const isCenter = item.label === 'Reflect';

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1.55rem] px-1 text-[10px] font-semibold text-muted-foreground transition-all duration-300 touch-manipulation',
                active && 'text-foreground',
                isCenter ? '-mt-5' : 'py-2.5'
              )}
              draggable={false}
            >
              {active && !isCenter && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute inset-1 rounded-[1.35rem] bg-foreground/[0.06] dark:bg-white/[0.09]"
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                />
              )}

              <span
                className={cn(
                  'relative flex items-center justify-center transition-all duration-300',
                  isCenter
                    ? 'h-14 w-14 rounded-[1.45rem] bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-500 text-white shadow-[0_18px_36px_rgba(37,99,235,0.34)]'
                    : 'h-8 w-8 rounded-2xl',
                  active && !isCenter && 'bg-primary/10 text-primary',
                  !active && !isCenter && 'text-muted-foreground'
                )}
              >
                {isCenter && active && (
                  <motion.span
                    layoutId="bottom-nav-center"
                    className="absolute inset-0 rounded-[1.45rem] ring-4 ring-white/45 dark:ring-white/10"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  />
                )}
                <Icon className={cn('relative h-4 w-4', isCenter && 'h-5 w-5')} />
              </span>

              <span
                className={cn(
                  'relative max-w-full truncate leading-none',
                  isCenter && 'mt-1 text-[11px]',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
