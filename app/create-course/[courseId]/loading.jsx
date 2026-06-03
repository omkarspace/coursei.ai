export default function CreateCourseLoading() {
  return (
    <div className="mt-10 px-6 sm:px-10 md:px-20 lg:px-32 xl:px-44">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-64 mx-auto mb-8" />
      <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse mb-6" />
      <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full mt-8" />
    </div>
  );
}
