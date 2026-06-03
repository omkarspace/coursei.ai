import { Suspense } from "react";
import { getPublishedCourseById } from "@/app/actions/course";
import { notFound } from "next/navigation";
import CourseClient from "./_components/CourseClient";

export async function generateMetadata({ params }) {
  const { courseId } = await params;
  const course = await getPublishedCourseById(courseId);
  if (!course) return {};

  return {
    title: `${course.courseOutput?.course?.name || "Course"} - Coursei.ai`,
    description: course.courseOutput?.course?.description,
    openGraph: {
      title: course.courseOutput?.course?.name,
      description: course.courseOutput?.course?.description,
      images: course.courseBanner ? [course.courseBanner] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: course.courseOutput?.course?.name,
      description: course.courseOutput?.course?.description,
    },
  };
}

async function CourseData({ courseId }) {
  const course = await getPublishedCourseById(courseId);
  if (!course) notFound();
  return <CourseClient course={course} />;
}

function CourseSkeleton() {
  return (
    <div className="min-h-screen dark:bg-gray-950">
      <div className="px-4 sm:px-6 md:px-10 lg:px-20 xl:px-44 py-6 lg:py-10">
        <div className="space-y-8">
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Course({ params }) {
  const { courseId } = await params;

  return (
    <Suspense fallback={<CourseSkeleton />}>
      <CourseData courseId={courseId} />
    </Suspense>
  );
}
