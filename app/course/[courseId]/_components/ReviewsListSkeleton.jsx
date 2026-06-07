import { Skeleton } from '@/components/ui/skeleton';

export default function ReviewsListSkeleton() {
  return (
    <section className="space-y-3">
      <Skeleton className="h-6 w-24" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </section>
  );
}
