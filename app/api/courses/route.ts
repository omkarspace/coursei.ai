import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { CourseList, Chapters } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { cacheGet, cacheSet, cacheKeys, cacheTTL } from "@/server/services/cache";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const category = searchParams.get("category") ?? undefined;

    const cacheKey = cacheKeys.marketplaceList(offset / limit + 1, category);
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const query = db
      .select({
        courseId: CourseList.courseId,
        name: CourseList.name,
        category: CourseList.category,
        level: CourseList.level,
        courseBanner: CourseList.courseBanner,
        userName: CourseList.userName,
        createdAt: CourseList.createdAt,
      })
      .from(CourseList)
      .where(eq(CourseList.publish, true))
      .orderBy(desc(CourseList.createdAt))
      .limit(limit)
      .offset(offset);

    const courses = await query;

    const coursesWithChapters = await Promise.all(
      courses.map(async (course) => {
        const chapters = await db
          .select({ count: Chapters.id })
          .from(Chapters)
          .where(eq(Chapters.courseId, course.courseId));

        return {
          ...course,
          chapterCount: chapters.length,
        };
      })
    );

    const response = {
      courses: coursesWithChapters,
      pagination: {
        limit,
        offset,
        hasMore: courses.length === limit,
      },
    };

    await cacheSet(cacheKey, response, cacheTTL.marketplace);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
