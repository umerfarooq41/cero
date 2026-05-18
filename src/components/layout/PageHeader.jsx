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
          w-full
          max-w-6xl
          px-4
          pt-5
          pb-4
          md:px-6
          md:pt-6
          md:pb-5
        "
      >
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
    </header>
  );
}