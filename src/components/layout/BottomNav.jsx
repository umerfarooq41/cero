import {
  ChartPie,
  CalendarCheck,
  ArrowLeftRight,
  WalletCards,
  Settings,
} from 'lucide-react';

const navItems = [
  { path: '/reflect', icon: ChartPie, label: 'Reflect' },
  { path: '/', icon: CalendarCheck, label: 'Plan' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/accounts', icon: WalletCards, label: 'Accounts' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        app-fixed-surface
        border-0
        shadow-none
        ring-0
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
                  flex flex-col items-center justify-center
                  gap-1
                  px-2 py-2
                  transition-all duration-200
                  `,
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    `
                    w-5 h-5
                    transition-all duration-200
                    `,
                    isActive && 'scale-110 stroke-[2.5]'
                  )}
                />

                <span
                  className={cn(
                    `
                    text-[11px]
                    transition-all duration-200
                    `,
                    isActive ? 'font-semibold' : 'font-medium'
                  )}
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