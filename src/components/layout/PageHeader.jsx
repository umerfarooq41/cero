import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PageHeader({ title, subtitle, className, actions }) {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const showSettingsAction = !location.pathname.startsWith('/settings');

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    const onScroll = () => setScrolled(main.scrollTop > 6);
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      data-no-page-entrance
      className={cn(
        'sticky top-0 z-40 app-fixed-surface border-0 ring-0',
        'transition-shadow duration-300',
        scrolled
          ? 'shadow-[0_1px_0_hsl(var(--border)),0_4px_20px_rgba(15,23,42,0.07)] dark:shadow-[0_1px_0_hsl(var(--border)),0_4px_20px_rgba(0,0,0,0.3)]'
          : 'shadow-none',
        className
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 pt-5 pb-4 md:px-6 md:pt-6 md:pb-5 flex items-end justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.28, delay: 0.06 }}
              className="mt-1 text-sm text-muted-foreground"
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        {(actions || showSettingsAction) && (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            {showSettingsAction && (
              <Link
                to="/settings"
                aria-label="Open settings"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground shadow-sm transition-colors hover:bg-secondary/80 hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
