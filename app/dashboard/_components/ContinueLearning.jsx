import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { CourseList, UserProgress } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import Link from 'next/link';
import { HiPlay } from 'react-icons/hi2';

export default async function ContinueLearning() {
  let content;
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const recentProgress = await db
      .select({
        courseId: UserProgress.courseId,
        lastAccessedAt: UserProgress.lastAccessedAt,
      })
      .from(UserProgress)
      .where(eq(UserProgress.userId, userId))
      .orderBy(sql`${UserProgress.lastAccessedAt} DESC`)
      .limit(1);

    if (recentProgress.length === 0 || !recentProgress[0]) return null;

    const courseId = recentProgress[0].courseId;
    const courseRows = await db
      .select()
      .from(CourseList)
      .where(eq(CourseList.courseId, courseId));

    const course = courseRows[0];
    if (!course) return null;

    const output = course.courseOutput;

    const progress = await db
      .select()
      .from(UserProgress)
      .where(and(eq(UserProgress.userId, userId), eq(UserProgress.courseId, courseId)));

    const completed = new Set(progress.filter((p) => p.completed).map((p) => p.chapterId));
    const chapters = output.course.chapters;
    const chapterNames = chapters.map((ch) => ch.name);

    let nextChapter = null;
    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      if (!ch) continue;
      if (completed.has(i)) continue;

      const prereqs = ch.prerequisites ?? [];
      const prereqsMet = prereqs.every((prereqName) => {
        const idx = chapterNames.indexOf(prereqName);
        return idx === -1 || completed.has(idx);
      });

      if (prereqsMet) {
        nextChapter = { index: i, name: ch.name };
        break;
      }
    }

    if (!nextChapter) {
      return (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-green-700 dark:text-green-300 font-medium">
            You&apos;ve completed all chapters! Great work!
          </p>
        </div>
      );
    }

    content = (
      <Link
        href={`/course/${courseId}/start`}
        className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
      >
        <HiPlay className="h-6 w-6 text-purple-600 dark:text-purple-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400">Continue learning</p>
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {course.name} — {nextChapter.name}
          </p>
        </div>
      </Link>
    );
  } catch {
    return null;
  }

  return <div className="mb-6">{content}</div>;
}
