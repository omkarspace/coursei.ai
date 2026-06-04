'use client';
import dynamic from 'next/dynamic';

const ConceptCanvas = dynamic(() => import('@/app/_components/ConceptCanvas'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading concept map...</p>
      </div>
    </div>
  ),
});

export default function ConceptCanvasWrapper({ courseId, course }) {
  return <ConceptCanvas courseId={courseId} course={course} />;
}
