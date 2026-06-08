'use server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { CourseList } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { designCurriculum } from '@/server/ai/agents/curriculum-designer';
import { checkFacts } from '@/server/ai/agents/fact-checker';
import { reviewPedagogy } from '@/server/ai/agents/pedagogical-expert';
import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/server/services/cache';

interface OutlineChapter {
  name: string;
  about: string;
  duration: string;
  difficulty?: string;
  learningObjectives?: string[];
  prerequisites?: string[];
}

interface OutlineResult {
  courseName: string;
  courseDescription: string;
  duration: string;
  chapters: OutlineChapter[];
}

export async function generateOutlineAction(input: {
  courseId: string;
  category: string;
  topic: string;
  level: string;
  duration: string;
  numChapters: number;
}): Promise<OutlineResult> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('No email');

  const rows = await db
    .select()
    .from(CourseList)
    .where(and(eq(CourseList.courseId, input.courseId), eq(CourseList.createdBy, email)));
  if (!rows[0]) throw new Error('Course not found or not owned by you');

  await db
    .update(CourseList)
    .set({
      status: 'generating_outline',
      progress: 5,
      currentStep: 'Designing curriculum...',
    })
    .where(eq(CourseList.courseId, input.courseId));

  const curriculum = await designCurriculum(
    input.category,
    input.topic,
    input.level,
    input.duration,
    input.numChapters
  );
  const factCheck = await checkFacts(curriculum);
  const pedagogy = await reviewPedagogy(
    factCheck.adjustedChapters,
    curriculum.course.name,
    curriculum.course.description
  );

  const finalChapters = pedagogy.finalChapters;
  const courseOutput = {
    course: {
      name: curriculum.course.name,
      description: curriculum.course.description,
      noOfChapters: finalChapters.length,
      duration: curriculum.course.duration,
      chapters: finalChapters.map((ch) => ({
        name: ch.name,
        about: ch.about,
        duration: ch.duration,
        difficulty: ch.difficulty,
        learningObjectives: ch.learningObjectives,
        prerequisites: ch.prerequisites,
      })),
    },
  };

  await db
    .update(CourseList)
    .set({
      courseOutput,
      status: 'outline_ready',
      progress: 35,
      currentStep: 'Outline ready — review and approve',
    })
    .where(eq(CourseList.courseId, input.courseId));

  await invalidateCache(`course:${input.courseId}`);

  return {
    courseName: curriculum.course.name,
    courseDescription: curriculum.course.description,
    duration: curriculum.course.duration,
    chapters: finalChapters.map((ch) => ({
      name: ch.name,
      about: ch.about,
      duration: ch.duration,
      difficulty: ch.difficulty,
      learningObjectives: ch.learningObjectives,
      prerequisites: ch.prerequisites,
    })),
  };
}

export async function saveOutlineAction(
  courseId: string,
  chapters: { name: string; about: string; difficulty?: string; learningObjectives?: string[]; prerequisites?: string[] }[]
): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('No email');

  const rows = await db
    .select()
    .from(CourseList)
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));
  const course = rows[0];
  if (!course) throw new Error('Course not found or not owned by you');
  if (course.status !== 'outline_ready') throw new Error('Outline not in editable state');

  const existing = course.courseOutput as {
    course: {
      name: string;
      description: string;
      noOfChapters: number;
      duration: string;
      chapters: {
        name: string;
        about: string;
        duration: string;
        difficulty?: string;
        learningObjectives?: string[];
        prerequisites?: string[];
      }[];
    };
  };

  const newCourseOutput: typeof existing = {
    ...existing,
    course: {
      ...existing.course,
      chapters: chapters.map((ch, i) => {
        const existingCh = existing.course.chapters[i];
        return {
          name: ch.name,
          about: ch.about,
          duration: existingCh?.duration ?? '',
          difficulty: ch.difficulty ?? existingCh?.difficulty,
          learningObjectives: ch.learningObjectives ?? existingCh?.learningObjectives,
          prerequisites: ch.prerequisites ?? existingCh?.prerequisites,
        };
      }),
    },
  };

  await db
    .update(CourseList)
    .set({ courseOutput: newCourseOutput, updatedAt: new Date() })
    .where(eq(CourseList.courseId, courseId));

  await invalidateCache(`course:${courseId}`);
  revalidatePath(`/create-course/${courseId}/outline`);
}
