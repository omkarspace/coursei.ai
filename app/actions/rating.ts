"use server";

import { db } from "@/server/db";
import { CourseRatings } from "@/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCourseRatings(courseId: string) {
  const ratings = await db
    .select()
    .from(CourseRatings)
    .where(eq(CourseRatings.courseId, courseId))
    .orderBy(CourseRatings.createdAt);
  return ratings;
}

export async function getCourseRatingSummary(courseId: string) {
  const result = await db
    .select({
      average: sql<number>`COALESCE(AVG(${CourseRatings.rating}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(CourseRatings)
    .where(eq(CourseRatings.courseId, courseId));
  return {
    average: Number(result[0]?.average) || 0,
    count: Number(result[0]?.count) || 0,
  };
}

export async function getUserCourseRating(courseId: string) {
  const { userId } = await auth();
  if (!userId) return null;
  const result = await db
    .select()
    .from(CourseRatings)
    .where(
      and(eq(CourseRatings.courseId, courseId), eq(CourseRatings.userId, userId))
    );
  return result[0] || null;
}

export async function submitRating(courseId: string, rating: number, review?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");

  const existing = await db
    .select()
    .from(CourseRatings)
    .where(
      and(eq(CourseRatings.courseId, courseId), eq(CourseRatings.userId, userId))
    );

  if (existing[0]) {
    await db.update(CourseRatings).set({ rating, review }).where(eq(CourseRatings.id, existing[0].id));
  } else {
    await db.insert(CourseRatings).values({ courseId, userId, rating, review });
  }

  revalidatePath(`/course/${courseId}`);
  revalidatePath("/dashboard/explore");
  return { success: true };
}

export async function deleteRating(courseId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await db
    .delete(CourseRatings)
    .where(
      and(eq(CourseRatings.courseId, courseId), eq(CourseRatings.userId, userId))
    );
  revalidatePath(`/course/${courseId}`);
  return { success: true };
}
