import { inngest } from "@/server/services/inngest";
import { db } from "@/server/db";
import { CourseList, Chapters } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { isKnowledgeGraphEnabled, buildCourseGraph } from "../services/knowledge-graph";
import { extractCrossChapterConcepts } from "./extract-concepts";

export const buildCourseGraphFunction = inngest.createFunction(
  {
    id: "build-course-graph",
    triggers: [{ event: "course.build_graph" }],
  },
  async ({ event, step }) => {
    const { courseId } = event.data as { courseId: string };

    if (!isKnowledgeGraphEnabled()) {
      console.log("Knowledge graph not configured, skipping");
      return { courseId, skipped: true };
    }

    // Step 1: Fetch course and chapter data
    const courseData = await step.run("fetch-course-data", async () => {
      const courses = await db
        .select()
        .from(CourseList)
        .where(eq(CourseList.courseId, courseId));
      const course = courses[0];
      if (!course) throw new Error(`Course ${courseId} not found`);

      const chapters = await db
        .select()
        .from(Chapters)
        .where(eq(Chapters.courseId, courseId))
        .orderBy(Chapters.chapterId);

      return {
        courseId: course.courseId,
        name: course.name,
        category: course.category,
        level: course.level,
        chapters: chapters.map((ch) => ({
          name: (course.courseOutput as any)?.course?.chapters?.[ch.chapterId]?.name || `Chapter ${ch.chapterId}`,
          content: Array.isArray(ch.content) ? ch.content : [],
        })),
      };
    });

    // Step 2: Extract concepts from all chapters
    const { concepts, relationships } = await step.run("extract-concepts", () =>
      extractCrossChapterConcepts(courseData.name, courseData.chapters)
    );

    // Step 3: Build the graph in Neo4j
    await step.run("build-graph", () =>
      buildCourseGraph(
        courseData.courseId,
        courseData.name,
        courseData.category,
        courseData.level,
        concepts,
        relationships
      )
    );

    return {
      courseId,
      conceptsExtracted: concepts.length,
      relationshipsCreated: relationships.length,
    };
  }
);
