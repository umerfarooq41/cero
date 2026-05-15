import { cn } from '@/lib/utils';

export default function PageHeader({
  title,
  subtitle,
  className,
}) {
  return (
      <header
        className={cn(
          `
          sticky top-0 z-40
          app-fixed-surface
          border-0 border-b-0
          shadow-none
          ring-0
          backdrop-blur-xl
          supports-[backdrop-filter]:backdrop-blur-xl
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
            text-3xl
            font-bold
            tracking-tight
            text-foreground
            md:text-4xl
          "
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="
              mt-1
              text-base
              text-muted-foreground
              md:text-lg
            "
          >
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}