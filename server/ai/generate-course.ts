import { inngest } from "@/server/services/inngest";
import { db } from "@/server/db";
import { CourseList, Chapters } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { generateChapterContent } from "./generate";
import { getVideos } from "@/server/services/youtube";
import { generateChapterIllustration } from "@/server/services/fal";

export const generateCourse = inngest.createFunction(
  {
    id: "generate-course",
    triggers: [{ event: "course.generate" }],
  },
  async ({ event, step }) => {
    const { courseId, topic, chapters, includeVideo } = event.data as {
      courseId: string;
      topic: string;
      chapters: { name: string; about: string; duration: string }[];
      includeVideo: string;
    };

    // Step 1: Update status to generating
    await step.run("update-status-generating", () =>
      db
        .update(CourseList)
        .set({
          status: "generating_chapters",
          progress: 10,
          currentStep: "Starting generation...",
        })
        .where(eq(CourseList.courseId, courseId))
    );

    // Step 2: Generate content for each chapter
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const progress = Math.round(10 + (i / chapters.length) * 80);

      await step.run(`generate-chapter-${i}`, async () => {
        // Update progress
        await db
          .update(CourseList)
          .set({
            progress,
            currentStep: `Generating chapter ${i + 1} of ${chapters.length}: ${chapter.name}`,
          })
          .where(eq(CourseList.courseId, courseId));

        // Generate chapter content using Vercel AI SDK
        let content;
        try {
          content = await generateChapterContent(topic, chapter.name);
        } catch (error) {
          console.error(`Error generating chapter ${i}:`, error);
          content = [
            {
              title: chapter.name,
              explanation: chapter.about,
              code: "",
            },
          ];
        }

        // Fetch YouTube video if enabled
        let videoId = "";
        if (includeVideo === "Yes") {
          try {
            const videoResponse = await getVideos(`${topic}: ${chapter.name}`);
            videoId = videoResponse[0]?.id?.videoId || "";
          } catch (error) {
            console.error("Error fetching video:", error);
          }
        }

        // Save chapter to database
        await db.insert(Chapters).values({
          courseId,
          chapterId: i,
          content,
          videoId,
        });

        // Generate chapter illustration (non-blocking, fail silently)
        try {
          const illustrationUrl = await generateChapterIllustration(chapter.name, topic);
          if (illustrationUrl) {
            console.log(`Generated illustration for chapter ${chapter.name}`);
          }
        } catch (error) {
          console.error(`Failed to generate illustration for chapter ${chapter.name}:`, error);
        }
      });
    }

    // Step 3: Mark as complete (course remains unpublished until user publishes)
    await step.run("update-status-complete", () =>
      db
        .update(CourseList)
        .set({
          status: "complete",
          progress: 100,
          currentStep: "Complete",
        })
        .where(eq(CourseList.courseId, courseId))
    );

    return { courseId, status: "complete" };
  }
);
