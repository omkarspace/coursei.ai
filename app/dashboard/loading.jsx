'use client';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen dark:bg-gray-950">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-6 space-y-4 md:space-y-0">
        <div className="flex flex-col">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64" />
        </div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40" />
      </div>
      <div className="mt-10 px-4 md:px-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-full bg-slate-200 dark:bg-gray-800 animate-pulse rounded-lg h-[270px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
