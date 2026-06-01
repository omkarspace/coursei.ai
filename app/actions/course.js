"use server";

import { db } from "@/lib/db";
import { CourseList, Chapters } from "@/configs/schema";
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
