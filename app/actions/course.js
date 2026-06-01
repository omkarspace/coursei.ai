"use server";

import { db } from "@/lib/db";
import { CourseList, Chapters, Quizzes, Flashcards, StudyNotes } from "@/configs/schema";
import { eq, and } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";

async function getUserEmail() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await (await clerkClient()).users.getUser(userId);
  return user.emailAddresses[0]?.emailAddress;
}

export async function getUserCourses() {
  const email = await getUserEmail();
  const courses = await db
    .select()
    .from(CourseList)
    .where(eq(CourseList.createdBy, email));
  return courses;
}

export async function getCourseById(courseId) {
  const email = await getUserEmail();
  const courses = await db
    .select()
    .from(CourseList)
    .where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, email)
      )
    );
  return courses[0] || null;
}

export async function getPublishedCourseById(courseId) {
  const courses = await db
    .select()
    .from(CourseList)
    .where(eq(CourseList.courseId, courseId));
  return courses[0] || null;
}

export async function getAllPublishedCourses(page = 0, limit = 9) {
  const courses = await db
    .select()
    .from(CourseList)
    .limit(limit)
    .offset(page * limit);
  return courses;
}

export async function createCourse(courseData) {
  const email = await getUserEmail();
  const user = await (await clerkClient()).users.getUser(
    (await auth()).userId
  );

  const result = await db.insert(CourseList).values({
    ...courseData,
    createdBy: email,
    userName: user.fullName,
    userProfileImage: user.imageUrl,
  }).returning({ id: CourseList.id, courseId: CourseList.courseId });

  return result[0];
}

export async function updateCourse(courseId, updates) {
  const email = await getUserEmail();
  const result = await db
    .update(CourseList)
    .set(updates)
    .where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, email)
      )
    )
    .returning({ id: CourseList.id });
  return result[0];
}

export async function updateCourseBanner(courseId, bannerUrl) {
  const email = await getUserEmail();
  await db
    .update(CourseList)
    .set({ courseBanner: bannerUrl })
    .where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, email)
      )
    );
}

export async function deleteCourse(courseId) {
  const email = await getUserEmail();
  const result = await db
    .delete(CourseList)
    .where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, email)
      )
    )
    .returning({ id: CourseList.id });
  return result[0];
}

export async function publishCourse(courseId) {
  const email = await getUserEmail();
  await db
    .update(CourseList)
    .set({ publish: true })
    .where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, email)
      )
    );
}

export async function getCourseChapters(courseId) {
  const chapters = await db
    .select()
    .from(Chapters)
    .where(eq(Chapters.courseId, courseId))
    .orderBy(Chapters.chapterId);
  return chapters;
}

export async function createChapter(chapterData) {
  await getUserEmail(); // verify auth
  await db.insert(Chapters).values(chapterData);
}

export async function updateCourseNameAndDescription(courseId, name, description) {
  const email = await getUserEmail();
  const courses = await db
    .select()
    .from(CourseList)
    .where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, email)
      )
    );

  if (!courses[0]) throw new Error("Course not found");

  const courseOutput = courses[0].courseOutput;
  courseOutput.course.name = name;
  courseOutput.course.description = description;

  await db
    .update(CourseList)
    .set({ courseOutput })
    .where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, email)
      )
    );
}

// Quiz actions
export async function getQuiz(courseId, chapterId) {
  await getUserEmail();
  const result = await db
    .select()
    .from(Quizzes)
    .where(and(eq(Quizzes.courseId, courseId), eq(Quizzes.chapterId, chapterId)));
  return result[0] || null;
}

export async function saveQuiz(courseId, chapterId, questions) {
  await getUserEmail();
  const existing = await getQuiz(courseId, chapterId);
  if (existing) {
    await db
      .update(Quizzes)
      .set({ questions })
      .where(eq(Quizzes.id, existing.id));
  } else {
    await db.insert(Quizzes).values({ courseId, chapterId, questions });
  }
}

// Flashcards actions
export async function getFlashcards(courseId, chapterId) {
  await getUserEmail();
  const result = await db
    .select()
    .from(Flashcards)
    .where(and(eq(Flashcards.courseId, courseId), eq(Flashcards.chapterId, chapterId)));
  return result[0] || null;
}

export async function saveFlashcards(courseId, chapterId, cards) {
  await getUserEmail();
  const existing = await getFlashcards(courseId, chapterId);
  if (existing) {
    await db
      .update(Flashcards)
      .set({ cards })
      .where(eq(Flashcards.id, existing.id));
  } else {
    await db.insert(Flashcards).values({ courseId, chapterId, cards });
  }
}

// Study Notes actions
export async function getStudyNotes(courseId, chapterId) {
  await getUserEmail();
  const result = await db
    .select()
    .from(StudyNotes)
    .where(and(eq(StudyNotes.courseId, courseId), eq(StudyNotes.chapterId, chapterId)));
  return result[0] || null;
}

export async function saveStudyNotes(courseId, chapterId, notes) {
  await getUserEmail();
  const existing = await getStudyNotes(courseId, chapterId);
  if (existing) {
    await db
      .update(StudyNotes)
      .set({ notes })
      .where(eq(StudyNotes.id, existing.id));
  } else {
    await db.insert(StudyNotes).values({ courseId, chapterId, notes });
  }
}
