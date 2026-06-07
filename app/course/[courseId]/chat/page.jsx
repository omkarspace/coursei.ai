import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { getPublishedCourseById } from '@/app/actions/course';
import CourseChat from '@/app/_components/CourseChat';
import Header from '@/app/dashboard/_components/Header';

export const metadata = { title: 'Chat — coursei.ai' };

export default async function CourseChatPage({ params }) {
  const { courseId } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const course = await getPublishedCourseById(courseId);
  if (!course) notFound();

  return (
    <div className="min-h-screen dark:bg-gray-950">
      <Header />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-1">Chat with {course.name}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          AI tutor grounded in this course. Cite chapter names when relevant.
        </p>
        <CourseChat courseId={courseId} courseName={course.name} />
      </div>
    </div>
  );
}
