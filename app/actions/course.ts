'use server';

import { db } from '@/server/db';
import {
  CourseList,
  Chapters,
  Quizzes,
  Flashcards,
  StudyNotesTable,
  UserProgress,
} from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { upsertCourseVectorFull, deleteCourseVector } from '@/server/services/vector';
import { getCachedCourse, setCachedCourse, invalidateCourseCache } from '@/server/services/cache';
import { inngest } from '@/server/services/inngest';
import type {
  CourseOutput,
  Chapter,
  QuizQuestion,
  Flashcard,
  StudyNotes,
} from '@/server/db/schema';

async function getUserEmail(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const user = await (await clerkClient()).users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('No email found');
  return email;
}

export async function getUserCoursesWithProgress() {
  const email = await getUserEmail();
  
  // Get all user courses
  const courses = await db.select().from(CourseList).where(eq(CourseList.createdBy, email));
  
  // Get progress data for all courses in one query
  const allProgress = await db
    .select({
      courseId: UserProgress.courseId,
      completedChapters: sql<number>`COUNT(*) FILTER (WHERE ${UserProgress.completed} = true)`,
      lastAccessedAt: sql<Date>`MAX(${UserProgress.lastAccessedAt})`,
    })
    .from(UserProgress)
    .where(
      eq(UserProgress.userId, (await auth()).userId!)
    )
    .groupBy(UserProgress.courseId);
  
  // Create a map for quick lookup
  const progressMap = new Map(
    allProgress.map(p => [p.courseId, {
      completedChapters: Number(p.completedChapters),
      lastAccessedAt: p.lastAccessedAt,
    }])
  );
  
  // Merge course data with progress
  return courses.map(course => {
    const progress = progressMap.get(course.courseId);
    const totalChapters = (course.courseOutput as CourseOutput)?.course?.chapters?.length || 0;
    const completedChapters = progress?.completedChapters || 0;
    const learningProgress = totalChapters > 0 
      ? Math.round((completedChapters / totalChapters) * 100) 
      : 0;
    
    return {
      ...course,
      learningProgress,
      completedChapters,
      totalChapters,
      lastAccessedAt: progress?.lastAccessedAt || null,
    };
  });
}

export async function getCourseById(courseId: string) {
  const cached = await getCachedCourse(courseId);
  if (cached) return cached;

  const email = await getUserEmail();
  const courses = await db
    .select()
    .from(CourseList)
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));

  const course = courses[0] || null;
  if (course) {
    await setCachedCourse(courseId, course);
  }
  return course;
}

export async function getPublishedCourseById(courseId: string) {
  const courses = await db.select().from(CourseList).where(eq(CourseList.courseId, courseId));
  return courses[0] || null;
}

export async function createCourse(courseData: {
  courseId: string;
  name: string;
  category: string;
  level: string;
  includeVideo: string;
  courseOutput?: CourseOutput;
}) {
  const email = await getUserEmail();
  const user = await (await clerkClient()).users.getUser((await auth()).userId!);

  const emptyOutput: CourseOutput = {
    course: { name: courseData.name, description: '', noOfChapters: 0, duration: '', chapters: [] },
  };

  const result = await db
    .insert(CourseList)
    .values({
      ...courseData,
      courseOutput: courseData.courseOutput ?? emptyOutput,
      createdBy: email,
      userName: user.fullName,
      userProfileImage: user.imageUrl,
    })
    .returning({ id: CourseList.id, courseId: CourseList.courseId });

  revalidatePath('/dashboard');
  return result[0];
}

export async function updateCourseStatus(
  courseId: string,
  status: 'draft' | 'generating_outline' | 'outline_ready' | 'generating_chapters' | 'complete' | 'failed',
  progress: number,
  currentStep?: string,
  error?: string
) {
  await db
    .update(CourseList)
    .set({
      status,
      progress,
      currentStep,
      generationError: error,
    })
    .where(eq(CourseList.courseId, courseId));
}

export async function updateCourseBanner(courseId: string, bannerUrl: string) {
  const email = await getUserEmail();
  await db
    .update(CourseList)
    .set({ courseBanner: bannerUrl })
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));

  revalidatePath(`/course/${courseId}`);
  await invalidateCourseCache(courseId);
}

export async function deleteCourse(courseId: string) {
  const email = await getUserEmail();
  const result = await db
    .delete(CourseList)
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)))
    .returning({ id: CourseList.id });

  // Remove from vector search
  try {
    await deleteCourseVector(courseId);
  } catch (error) {
    console.error('Failed to remove course from vector search:', error);
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/explore');
  await invalidateCourseCache(courseId);
  return result[0];
}

export async function publishCourse(courseId: string) {
  const email = await getUserEmail();

  // Get course data before publishing
  const courses = await db
    .select()
    .from(CourseList)
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));

  const course = courses[0];
  if (!course) throw new Error('Course not found');

  await db
    .update(CourseList)
    .set({ publish: true })
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));

  // Index in vector search with chapter-enriched embeddings
  const courseOutput = course.courseOutput as CourseOutput;
  try {
    const chapterData = (courseOutput.course.chapters || []).map((ch: Chapter) => ({
      name: ch.name,
      about: ch.about || '',
    }));

    await upsertCourseVectorFull(
      courseId,
      courseOutput.course.name,
      courseOutput.course.description,
      course.category,
      course.level,
      chapterData
    );

    // Record when vector was last indexed
    await db
      .update(CourseList)
      .set({ vectorIndexedAt: new Date() })
      .where(eq(CourseList.courseId, courseId));
  } catch (error) {
    console.error('Failed to index course in vector search:', error);
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/explore');
  revalidatePath(`/course/${courseId}`);
  await invalidateCourseCache(courseId);

  // Build knowledge graph
  await inngest.send({
    name: 'course.build_graph',
    data: { courseId },
  });
}

export async function updateCourseNameAndDescription(
  courseId: string,
  name: string,
  description: string
) {
  const email = await getUserEmail();
  const courses = await db
    .select()
    .from(CourseList)
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));

  if (!courses[0]) throw new Error('Course not found');

  const courseOutput = courses[0].courseOutput as CourseOutput;
  courseOutput.course.name = name;
  courseOutput.course.description = description;

  await db
    .update(CourseList)
    .set({ courseOutput })
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));

  revalidatePath(`/course/${courseId}`);
  revalidatePath('/dashboard');

  // Re-index vector search if course is published
  const updatedCourse = await db
    .select({ publish: CourseList.publish })
    .from(CourseList)
    .where(eq(CourseList.courseId, courseId));

  if (updatedCourse[0]?.publish) {
    await inngest.send({
      name: 'course.reindex_vectors',
      data: { courseId },
    });
  }
}

// Quiz actions
export async function getQuiz(courseId: string, chapterId: number) {
  await getUserEmail();
  const result = await db
    .select()
    .from(Quizzes)
    .where(and(eq(Quizzes.courseId, courseId), eq(Quizzes.chapterId, chapterId)));
  return result[0] || null;
}

export async function saveQuiz(courseId: string, chapterId: number, questions: QuizQuestion[]) {
  await getUserEmail();
  const existing = await getQuiz(courseId, chapterId);
  if (existing) {
    await db.update(Quizzes).set({ questions }).where(eq(Quizzes.id, existing.id));
  } else {
    await db.insert(Quizzes).values({ courseId, chapterId, questions });
  }
  revalidatePath(`/course/${courseId}/start`);
}

// Flashcards actions
export async function getFlashcards(courseId: string, chapterId: number) {
  await getUserEmail();
  const result = await db
    .select()
    .from(Flashcards)
    .where(and(eq(Flashcards.courseId, courseId), eq(Flashcards.chapterId, chapterId)));
  return result[0] || null;
}

export async function saveFlashcards(courseId: string, chapterId: number, cards: Flashcard[]) {
  await getUserEmail();
  const existing = await getFlashcards(courseId, chapterId);
  if (existing) {
    await db.update(Flashcards).set({ cards }).where(eq(Flashcards.id, existing.id));
  } else {
    await db.insert(Flashcards).values({ courseId, chapterId, cards });
  }
  revalidatePath(`/course/${courseId}/start`);
}

// Study Notes actions
export async function getStudyNotes(courseId: string, chapterId: number) {
  await getUserEmail();
  const result = await db
    .select()
    .from(StudyNotesTable)
    .where(and(eq(StudyNotesTable.courseId, courseId), eq(StudyNotesTable.chapterId, chapterId)));
  return result[0] || null;
}

export async function saveStudyNotes(courseId: string, chapterId: number, notes: StudyNotes) {
  await getUserEmail();
  const existing = await getStudyNotes(courseId, chapterId);
  if (existing) {
    await db.update(StudyNotesTable).set({ notes }).where(eq(StudyNotesTable.id, existing.id));
  } else {
    await db.insert(StudyNotesTable).values({ courseId, chapterId, notes });
  }
  revalidatePath(`/course/${courseId}/start`);
}

// User Progress actions
export async function getUserProgress(courseId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const progress = await db
    .select()
    .from(UserProgress)
    .where(and(eq(UserProgress.courseId, courseId), eq(UserProgress.userId, userId)));
  return progress;
}

export async function markChapterComplete(courseId: string, chapterId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const existing = await db
    .select()
    .from(UserProgress)
    .where(
      and(
        eq(UserProgress.courseId, courseId),
        eq(UserProgress.userId, userId),
        eq(UserProgress.chapterId, chapterId)
      )
    );

  if (existing[0]) {
    await db
      .update(UserProgress)
      .set({ completed: true, lastAccessedAt: new Date() })
      .where(eq(UserProgress.id, existing[0].id));
  } else {
    await db.insert(UserProgress).values({
      userId,
      courseId,
      chapterId,
      completed: true,
    });
  }
}

// Course forking
export async function forkCourse(sourceCourseId: string) {
  const email = await getUserEmail();
  const user = await (await clerkClient()).users.getUser((await auth()).userId!);

  // Get the source course
  const sourceCourses = await db
    .select()
    .from(CourseList)
    .where(eq(CourseList.courseId, sourceCourseId));

  const sourceCourse = sourceCourses[0];
  if (!sourceCourse) throw new Error('Source course not found');

  // Create a new course ID
  const newCourseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Copy course data
  const courseOutput = sourceCourse.courseOutput as CourseOutput;
  const newCourseOutput = {
    ...courseOutput,
    course: {
      ...courseOutput.course,
      name: `${courseOutput.course.name} (Forked)`,
    },
  };

  // Create the forked course
  const result = await db
    .insert(CourseList)
    .values({
      courseId: newCourseId,
      name: sourceCourse.name,
      category: sourceCourse.category,
      level: sourceCourse.level,
      includeVideo: sourceCourse.includeVideo,
      courseOutput: newCourseOutput,
      createdBy: email,
      userName: user.fullName,
      userProfileImage: user.imageUrl,
      courseBanner: sourceCourse.courseBanner,
      publish: false,
      status: 'complete',
    })
    .returning({ id: CourseList.id, courseId: CourseList.courseId });

  // Copy chapters
  const sourceChapters = await db
    .select()
    .from(Chapters)
    .where(eq(Chapters.courseId, sourceCourseId));

  for (const chapter of sourceChapters) {
    await db.insert(Chapters).values({
      courseId: newCourseId,
      chapterId: chapter.chapterId,
      content: chapter.content,
      videoId: chapter.videoId,
    });
  }

  revalidatePath('/dashboard');
  return result[0];
}

// Chapter content fetching (for client components)
export async function getChapterContentAction(courseId: string, chapterId: number) {
  const result = await db
    .select()
    .from(Chapters)
    .where(and(eq(Chapters.chapterId, chapterId), eq(Chapters.courseId, courseId)));
  return result[0] || null;
}

// User progress fetching (for client components)
export async function getUserProgressAction(courseId: string) {
  const { userId } = await auth();
  if (!userId) return [];

  const progress = await db
    .select({ chapterId: UserProgress.chapterId })
    .from(UserProgress)
    .where(
      and(
        eq(UserProgress.courseId, courseId),
        eq(UserProgress.userId, userId),
        eq(UserProgress.completed, true)
      )
    );
  return progress.map((p) => p.chapterId);
}

export async function getPublishedCoursesWithFilters(
  page = 0,
  limit = 9,
  category?: string,
  level?: string
) {
  const allCourses = await db.select().from(CourseList).where(eq(CourseList.publish, true));
  let filtered = allCourses;
  if (category) filtered = filtered.filter((c) => c.category === category);
  if (level) filtered = filtered.filter((c) => c.level === level);
  return filtered.slice(page * limit, (page + 1) * limit);
}
