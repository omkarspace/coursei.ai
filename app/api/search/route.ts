import { NextResponse } from "next/server";
import { searchCourses, isVectorSearchEnabled } from "@/server/services/vector";
import { db } from "@/server/db";
import { CourseList } from "@/server/db/schema";
import { inArray } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    if (!isVectorSearchEnabled()) {
      // Fallback to text search if vector not configured
      const courses = await db
        .select({
          courseId: CourseList.courseId,
          name: CourseList.name,
          category: CourseList.category,
          level: CourseList.level,
          courseBanner: CourseList.courseBanner,
          createdBy: CourseList.createdBy,
          userName: CourseList.userName,
          publish: CourseList.publish,
        })
        .from(CourseList)
        .where(
          inArray(CourseList.publish, [true])
        )
        .limit(limit);

      // Simple text matching fallback
      const queryLower = query.toLowerCase();
      const filtered = courses.filter(
        (c) =>
          c.name.toLowerCase().includes(queryLower) ||
          c.category.toLowerCase().includes(queryLower)
      );

      return NextResponse.json({
        results: filtered.map((c) => ({
          ...c,
          score: 1.0,
        })),
        source: "text",
      });
    }

    // Semantic search
    const results = await searchCourses(query, Math.min(limit, 20));

    // Fetch full course data for matched IDs
    const courseIds = results
      .map((r) => {
        const metadata = r.metadata as Record<string, string>;
        return metadata?.courseId;
      })
      .filter(Boolean);

    if (courseIds.length === 0) {
      return NextResponse.json({ results: [], source: "vector" });
    }

    const courses = await db
      .select({
        courseId: CourseList.courseId,
        name: CourseList.name,
        category: CourseList.category,
        level: CourseList.level,
        courseBanner: CourseList.courseBanner,
        createdBy: CourseList.createdBy,
        userName: CourseList.userName,
        publish: CourseList.publish,
      })
      .from(CourseList)
      .where(inArray(CourseList.courseId, courseIds));

    // Merge vector results with course data
    const mergedResults = results
      .map((r) => {
        const metadata = r.metadata as Record<string, string>;
        const course = courses.find((c) => c.courseId === metadata.courseId);
        if (!course || !course.publish) return null;
        return {
          ...course,
          score: r.score,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      results: mergedResults,
      source: "vector",
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
