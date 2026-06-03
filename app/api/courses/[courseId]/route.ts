import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { CourseList, Chapters } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    const courses = await db
      .select()
      .from(CourseList)
      .where(
        and(
          eq(CourseList.courseId, courseId),
          eq(CourseList.publish, true)
        )
      );

    const course = courses[0];

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // Get chapters
    const chapters = await db
      .select()
      .from(Chapters)
      .where(eq(Chapters.courseId, courseId))
      .orderBy(Chapters.chapterId);

    return NextResponse.json({
      courseId: course.courseId,
      name: course.name,
      category: course.category,
      level: course.level,
      courseBanner: course.courseBanner,
      userName: course.userName,
      courseOutput: course.courseOutput,
      chapters: chapters.map((ch) => ({
        chapterId: ch.chapterId,
        content: ch.content,
      })),
      createdAt: course.createdAt,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
