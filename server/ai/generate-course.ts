import { inngest } from '@/server/services/inngest';
import { db } from '@/server/db';
import { CourseList, Chapters } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateChapterContent } from './generate';
import { getVideos } from '@/server/services/youtube';
import { generateChapterIllustration } from '@/server/services/fal';

export const generateChapters = inngest.createFunction(
  {
    id: 'generate-chapters',
    triggers: [{ event: 'course.generate_chapters' }],
  },
  async ({ event, step }) => {
    const { courseId } = event.data as { courseId: string };

    const courseRows = await db.select().from(CourseList).where(eq(CourseList.courseId, courseId));
    const courseData = courseRows[0];
    if (!courseData) throw new Error(`Course ${courseId} not found`);

    const topic = courseData.name;
    const includeVideo = courseData.includeVideo;
    const courseOutput = courseData.courseOutput as
      | {
          course: {
            chapters: { name: string; about: string; duration: string }[];
          };
        }
      | null;
    const finalChapters = courseOutput?.course?.chapters ?? [];

    await step.run('update-status-generating-chapters', () =>
      db
        .update(CourseList)
        .set({
          status: 'generating_chapters',
          progress: 35,
          currentStep: 'Generating chapter content...',
        })
        .where(eq(CourseList.courseId, courseId))
    );

    for (let i = 0; i < finalChapters.length; i++) {
      const chapter = finalChapters[i]!;
      const progress = Math.round(35 + (i / finalChapters.length) * 55);

      await step.run(`generate-chapter-${i}`, async () => {
        await db
          .update(CourseList)
          .set({
            progress,
            currentStep: `Generating chapter ${i + 1} of ${finalChapters.length}: ${chapter.name}`,
          })
          .where(eq(CourseList.courseId, courseId));

        let content;
        try {
          content = await generateChapterContent(topic, chapter.name);
        } catch (error) {
          console.error(`Error generating chapter ${i}:`, error);
          content = [
            {
              title: chapter.name,
              explanation: chapter.about,
              code: '',
            },
          ];
        }

        let videoId = '';
        if (includeVideo === 'Yes') {
          try {
            const videoResponse = await getVideos(`${topic}: ${chapter.name}`);
            videoId = videoResponse[0]?.id?.videoId || '';
          } catch (error) {
            console.error('Error fetching video:', error);
          }
        }

        await db.insert(Chapters).values({
          courseId,
          chapterId: i,
          content,
          videoId,
        });

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

    await step.run('update-status-complete', () =>
      db
        .update(CourseList)
        .set({
          status: 'complete',
          progress: 100,
          currentStep: 'Complete',
        })
        .where(eq(CourseList.courseId, courseId))
    );

    return { courseId, status: 'complete', chaptersGenerated: finalChapters.length };
  }
);
