import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PageHeader({
  title,
  subtitle,
  className,
}) {
  return (
    <header
      data-no-page-entrance
      className={cn(
        `
        sticky top-[var(--app-safe-area-top)] z-40
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
          className="
            mt-0.5
            flex h-10 w-10 shrink-0 items-center justify-center
            rounded-2xl
            bg-secondary/80
            text-muted-foreground
            shadow-sm
            transition-all
            hover:-translate-y-0.5
            hover:bg-secondary
            hover:text-foreground
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-ring
            focus-visible:ring-offset-2
          "
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}
