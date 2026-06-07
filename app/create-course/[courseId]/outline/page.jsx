import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/server/db';
import { CourseList } from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';
import OutlineEditor from '../_components/OutlineEditor';

export default async function OutlinePage({ params }) {
  const { courseId } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await (await clerkClient()).users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) redirect('/sign-in');

  const rows = await db
    .select()
    .from(CourseList)
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));

  const course = rows[0];
  if (!course) redirect('/dashboard');

  const output = course.courseOutput;
  const chapters = output?.course?.chapters ?? [];

  return (
    <div className="mt-10 px-6 sm:px-10 md:px-20 lg:px-32 xl:px-44">
      <div className="mb-6">
        <h2 className="font-bold text-center text-2xl sm:text-2xl lg:text-3xl">
          Review Course Outline
        </h2>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
          Edit chapter names and descriptions, then generate full content.
        </p>
      </div>

      <div className="mb-6 p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h3 className="text-xl font-semibold">{output?.course?.name ?? course.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {output?.course?.description ?? 'No description yet.'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Duration: {output?.course?.duration ?? 'TBD'} • {chapters.length} chapters
        </p>
      </div>

      <OutlineEditor courseId={courseId} initialChapters={chapters} />
    </div>
  );
}
