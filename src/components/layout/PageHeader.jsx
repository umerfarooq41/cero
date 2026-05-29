import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import Logo from '@/components/Logo';
import { cn } from '@/lib/utils';

export default function PageHeader({
  title,
  subtitle,
  className,
}) {
  const location = useLocation();
  const settingsActive = location.pathname === '/settings';

  return (
    <header
      data-no-page-entrance
      className={cn(
        `
        app-page-header
        pointer-events-none
        fixed inset-x-0 top-0 z-50
        h-[var(--app-mobile-page-header-height)]
        bg-transparent
        border-0
        shadow-none
        ring-0
        lg:pointer-events-auto
        lg:static
        lg:z-10
        lg:h-auto
        `,
        className
      )}
    >
      <div
        className="
          pointer-events-auto
          mx-auto
          flex
          h-full
          w-full
          max-w-7xl
          items-center
          justify-between
          gap-4
          px-4
          pt-[calc(0.65rem+var(--app-safe-area-top))]
          pb-2
          md:px-6
          md:pt-[calc(0.8rem+var(--app-safe-area-top))]
          md:pb-2.5
          lg:h-auto
          lg:px-8
          lg:pt-10
          lg:pb-4
        "
      >
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo size={24} priority className="lg:hidden" />

            <h1
              className="
                min-w-0
                truncate
                text-[1.85rem]
                font-bold
                leading-none
                tracking-tight
                text-foreground
                lg:text-4xl
                lg:leading-[0.95]
              "
            >
              {title}
            </h1>
          </div>

          {subtitle && (
            <p
              className="
                mt-1
                max-w-2xl
                truncate
                text-[0.95rem]
                leading-tight
                text-muted-foreground
                lg:mt-3
                lg:overflow-visible
                lg:whitespace-normal
                lg:text-base
              "
            >
              {subtitle}
            </p>
          )}
        </div>

        <Link
          to="/settings"
          aria-label="Open settings"
          aria-current={settingsActive ? 'page' : undefined}
          data-haptic="true"
          className={cn(
            'group relative flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full transition-colors duration-200 lg:hidden',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            settingsActive
              ? 'text-primary'
              : 'text-muted-foreground/80 hover:text-foreground'
          )}
        >
          <motion.span
            whileTap={{ scale: 0.92 }}
            animate={{ scale: settingsActive ? 1.04 : 1, y: settingsActive ? -1 : 0 }}
            transition={{ type: 'spring', stiffness: 430, damping: 28 }}
            className="relative flex h-9 w-9 items-center justify-center rounded-full"
          >
            {settingsActive && (
              <motion.span
                layoutId="header-settings-active-orb"
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-primary/10 ring-1 ring-primary/35"
                style={{
                  boxShadow:
                    '0 0 0 1px hsl(var(--primary) / 0.18), 0 0 24px hsl(var(--primary) / 0.28), inset 0 1px 0 hsl(var(--foreground) / 0.08)',
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}

            {settingsActive && (
              <motion.span
                aria-hidden="true"
                className="absolute -inset-2 rounded-full bg-primary/15 blur-xl"
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
              />
            )}

            <Settings
              className={cn(
                'relative z-10 h-[1.15rem] w-[1.15rem] transition-all duration-200',
                settingsActive
                  ? 'text-primary stroke-[2.65]'
                  : 'text-muted-foreground/80 stroke-[2.25] group-hover:text-foreground'
              )}
            />
          </motion.span>
        </Link>
      </div>
    </header>
  );
}
