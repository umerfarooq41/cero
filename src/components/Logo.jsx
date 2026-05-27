import { cn } from '@/lib/utils';

export default function Logo({
  size = 32,
  className,
  imageClassName,
  priority = false,
}) {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: dimension, height: dimension }}
    >
      <img
        src="/logo-mark-on-light.png"
        alt=""
        loading={priority ? 'eager' : 'lazy'}
        className={cn('block h-full w-full object-contain dark:hidden', imageClassName)}
      />
      <img
        src="/logo-mark-on-dark.png"
        alt=""
        loading={priority ? 'eager' : 'lazy'}
        className={cn('hidden h-full w-full object-contain dark:block', imageClassName)}
      />
    </span>
  );
}
