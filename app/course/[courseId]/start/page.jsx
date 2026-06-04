import { Suspense } from 'react';
import { db } from '@/server/db';
import { Chapters, CourseList } from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import CourseStartClient from './_components/CourseStartClient';

async function getCourse(courseId) {
  const result = await db.select().from(CourseList).where(eq(CourseList.courseId, courseId));
  return result[0] || null;
}

async function getChapterContent(courseId, chapterId) {
  const result = await db
    .select()
    .from(Chapters)
    .where(and(eq(Chapters.chapterId, chapterId), eq(Chapters.courseId, courseId)));
  return result[0] || null;
}

export async function generateMetadata({ params }) {
  const { courseId } = await params;
  const course = await getCourse(courseId);
  if (!course) return {};

  return {
    title: `${course.courseOutput?.course?.name || 'Course'} - Coursei.ai`,
    description: course.courseOutput?.course?.description,
    openGraph: {
      title: course.courseOutput?.course?.name,
      description: course.courseOutput?.course?.description,
      images: course.courseBanner ? [course.courseBanner] : [],
    },
  };
}

export default async function CourseStart({ params }) {
  const { courseId } = await params;
  const course = await getCourse(courseId);

  if (!course) notFound();

  const initialChapterContent = await getChapterContent(courseId, 0);

  return (
    <Suspense fallback={<CourseStartSkeleton />}>
      <CourseStartClient course={course} initialChapterContent={initialChapterContent} />
    </Suspense>
  );
}

function CourseStartSkeleton() {
  return (
    <div className="min-h-screen dark:bg-gray-950">
      <div className="fixed md:w-64 h-screen bg-white dark:bg-gray-900 border-r dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 border-b dark:border-gray-800">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="md:ml-64 p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3 mb-4" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  );
}
