import { Link, useLocation } from 'react-router-dom';
import {
  PieChart,
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/reflect', icon: PieChart, label: 'Reflect' },
  { path: '/', icon: LayoutDashboard, label: 'Plan' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/accounts', icon: Wallet, label: 'Accounts' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        app-fixed-surface
        backdrop-blur-xl
        supports-[backdrop-filter]:backdrop-blur-xl
        lg:hidden
      "
    >
      <div
        className="
          mx-auto
          max-w-3xl
          grid grid-cols-5
          h-16
          pb-[env(safe-area-inset-bottom)]
        "
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center justify-center"
            >
              <div
                className={cn(
                  `
                  relative
                  flex flex-col items-center justify-center
                  gap-1
                  px-3 py-2
                  rounded-2xl
                  transition-all duration-200
                  `,
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <div
                    className="
                      absolute inset-0
                      rounded-2xl
                      bg-primary/10
                    "
                  />
                )}

                <item.icon
                  className={cn(
                    `
                    relative z-10
                    w-5 h-5
                    transition-all duration-200
                    `,
                    isActive && 'scale-110'
                  )}
                />

                <span
                  className="
                    relative z-10
                    text-[11px]
                    font-medium
                  "
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}