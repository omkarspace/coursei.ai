import { Suspense } from 'react';
import { getPublishedCourseById } from '@/app/actions/course';
import { notFound } from 'next/navigation';
import CourseShell from './_components/CourseShell';
import CourseRating from './_components/CourseRating';
import CourseForkButton from './_components/CourseForkButton';
import ChapterList from '@/app/create-course/[courseId]/_components/ChapterList';
import Header from '@/app/dashboard/_components/Header';
import ConceptCanvasWrapper from './_components/ConceptCanvasWrapper';

export async function generateMetadata({ params }) {
  const { courseId } = await params;
  const course = await getPublishedCourseById(courseId);
  if (!course) return {};

  return {
    title: `${course.courseOutput?.course?.name || 'Course'} - Coursei.ai`,
    description: course.courseOutput?.course?.description,
    openGraph: {
      title: course.courseOutput?.course?.name,
      description: course.courseOutput?.course?.description,
      images: course.courseBanner ? [course.courseBanner] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: course.courseOutput?.course?.name,
      description: course.courseOutput?.course?.description,
    },
  };
}

function RatingSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-1" />
      </div>
    </div>
  );
}

function ForkButtonSkeleton() {
  return <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />;
}

export default async function Course({ params }) {
  const { courseId } = await params;
  const course = await getPublishedCourseById(courseId);
  if (!course) notFound();

  return (
    <div className="min-h-screen dark:bg-gray-950">
      <Header />
      <div className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-44 py-6 lg:py-10">
        <div className="space-y-8">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CourseShell course={course} />
            </div>
            <div className="ml-4 mt-5">
              <Suspense fallback={<ForkButtonSkeleton />}>
                <CourseForkButton courseId={courseId} />
              </Suspense>
            </div>
          </div>
          <Suspense fallback={<RatingSkeleton />}>
            <CourseRating courseId={courseId} />
          </Suspense>
          <ChapterList course={course} />

          <div>
            <h3 className="font-bold text-lg dark:text-white mb-4">Concept Map</h3>
            <ConceptCanvasWrapper courseId={courseId} course={course} />
          </div>
        </div>
      </div>
    </div>
  );
}
