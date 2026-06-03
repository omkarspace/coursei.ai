import { NextResponse } from "next/server";
import { searchCourses, isVectorSearchEnabled } from "@/server/services/vector";
import { searchGraph, isKnowledgeGraphEnabled } from "@/server/services/knowledge-graph";
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

    // Try graph search first if available
    if (isKnowledgeGraphEnabled()) {
      try {
        const graphResults = await searchGraph(query, limit);

        // Also run vector search for combined results
        let vectorResults: { courseId: string; score: number }[] = [];
        if (isVectorSearchEnabled()) {
          const vectorHits = await searchCourses(query, limit);
          vectorResults = vectorHits.map((r) => ({
            courseId: (r.metadata as Record<string, string>)?.courseId || "",
            score: r.score,
          }));
        }

        // Merge graph + vector results, deduplicate by courseId
        const courseIds = new Set<string>();
        const merged: { courseId: string; score: number; source: string }[] = [];

        // Graph results (higher weight)
        for (const course of graphResults.relatedCourses) {
          if (!courseIds.has(course.courseId)) {
            courseIds.add(course.courseId);
            merged.push({
              courseId: course.courseId,
              score: course.relevance * 0.6,
              source: "graph",
            });
          }
        }

        // Vector results (supplement)
        for (const vr of vectorResults) {
          if (!courseIds.has(vr.courseId)) {
            courseIds.add(vr.courseId);
            merged.push({
              courseId: vr.courseId,
              score: vr.score * 0.4,
              source: "vector",
            });
          }
        }

        // Sort by score
        merged.sort((a, b) => b.score - a.score);

        if (merged.length > 0) {
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
            .where(inArray(CourseList.courseId, merged.map((m) => m.courseId)));

          const results = merged
            .map((m) => {
              const course = courses.find((c) => c.courseId === m.courseId);
              if (!course || !course.publish) return null;
              return { ...course, score: m.score, source: m.source };
            })
            .filter(Boolean);

          return NextResponse.json({
            results: results.slice(0, limit),
            source: "hybrid",
            conceptsFound: graphResults.concepts.length,
          });
        }
      } catch (error) {
        console.error("Graph search error, falling back to vector:", error);
      }
    }

    // Fallback: vector search
    if (isVectorSearchEnabled()) {
      const results = await searchCourses(query, Math.min(limit, 20));
      const courseIds = results
        .map((r) => (r.metadata as Record<string, string>)?.courseId)
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

      const mergedResults = results
        .map((r) => {
          const metadata = r.metadata as Record<string, string>;
          const course = courses.find((c) => c.courseId === metadata.courseId);
          if (!course || !course.publish) return null;
          return { ...course, score: r.score, source: "vector" };
        })
        .filter(Boolean);

      return NextResponse.json({ results: mergedResults, source: "vector" });
    }

    // Fallback: text search
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
      .where(inArray(CourseList.publish, [true]))
      .limit(limit);

    const queryLower = query.toLowerCase();
    const filtered = courses.filter(
      (c) =>
        c.name.toLowerCase().includes(queryLower) ||
        c.category.toLowerCase().includes(queryLower)
    );

    return NextResponse.json({
      results: filtered.map((c) => ({ ...c, score: 1.0 })),
      source: "text",
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
