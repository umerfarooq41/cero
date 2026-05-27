import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
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
        sticky top-0 z-40
        app-fixed-surface
        border-0
        shadow-none
        ring-0
        `,
        className
      )}
    >
      <div
        className="
          mx-auto
          flex
          w-full
          max-w-6xl
          items-start
          justify-between
          gap-4
          px-4
          pt-5
          pb-4
          md:px-6
          md:pt-6
          md:pb-5
        "
      >
        <div className="min-w-0">
          <h1
            className="
              text-2xl
              font-bold
              tracking-tight
              text-foreground
            "
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className="
                mt-1
                text-sm
                text-muted-foreground
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
            'group relative mt-0.5 flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center rounded-full transition-colors duration-200',
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
            className="relative flex h-10 w-10 items-center justify-center rounded-full"
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
                'relative z-10 h-5 w-5 transition-all duration-200',
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
