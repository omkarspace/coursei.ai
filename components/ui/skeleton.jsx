import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted dark:bg-gray-700', className)}
      {...props}
    />
  );
}

export { Skeleton };
