import { inngest } from "@/server/services/inngest";
import { db } from "@/server/db";
import { CourseList, Chapters } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { upsertCourseVectorFull } from "@/server/services/vector";

export const reindexCourseVectors = inngest.createFunction(
  {
    id: "reindex-course-vectors",
    triggers: [{ event: "course.reindex_vectors" }],
  },
  async ({ event, step }) => {
    const { courseId } = event.data as { courseId: string };

    // Step 1: Fetch course data
    const course = await step.run("fetch-course", async () => {
      const result = await db
        .select()
        .from(CourseList)
        .where(eq(CourseList.courseId, courseId));
      return result[0] || null;
    });

    if (!course || !course.publish) {
      return { courseId, skipped: true, reason: "Course not found or not published" };
    }

    // Step 2: Fetch chapters
    const chapters = await step.run("fetch-chapters", async () => {
      const result = await db
        .select()
        .from(Chapters)
        .where(eq(Chapters.courseId, courseId));
      return result;
    });

    // Step 3: Re-index vector with enriched data
    await step.run("upsert-vector", async () => {
      const courseOutput = course.courseOutput as any;
      const chapterData = (courseOutput.course.chapters || []).map(
        (ch: any) => ({
          name: ch.name,
          about: ch.about || "",
        })
      );

      await upsertCourseVectorFull(
        courseId,
        courseOutput.course.name,
        courseOutput.course.description,
        course.category,
        course.level,
        chapterData
      );

      await db
        .update(CourseList)
        .set({ vectorIndexedAt: new Date() })
        .where(eq(CourseList.courseId, courseId));
    });

    return { courseId, status: "reindexed" };
  }
);
