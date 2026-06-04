import { inngest } from '@/server/services/inngest';
import { db } from '@/server/db';
import { CourseList, Chapters } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateChapterContent } from './generate';
import { getVideos } from '@/server/services/youtube';
import { generateChapterIllustration } from '@/server/services/fal';
import { designCurriculum } from './agents/curriculum-designer';
import { checkFacts } from './agents/fact-checker';
import { reviewPedagogy } from './agents/pedagogical-expert';

export const generateCourse = inngest.createFunction(
  {
    id: 'generate-course',
    triggers: [{ event: 'course.generate' }],
  },
  async ({ event, step }) => {
    const { courseId } = event.data as { courseId: string };

    // Fetch full course data from DB
    const courseRows = await db.select().from(CourseList).where(eq(CourseList.courseId, courseId));
    const courseData = courseRows[0];
    if (!courseData) throw new Error(`Course ${courseId} not found`);

    const topic = courseData.name;
    const category = courseData.category;
    const level = courseData.level;
    const duration = (courseData.courseOutput as any)?.course?.duration || '4 weeks';
    const numChapters = (courseData.courseOutput as any)?.course?.chapters?.length || 6;
    const includeVideo = courseData.includeVideo;

    // Step 1: Update status to generating
    await step.run('update-status-generating', () =>
      db
        .update(CourseList)
        .set({
          status: 'generating_outline',
          progress: 5,
          currentStep: 'Designing curriculum...',
        })
        .where(eq(CourseList.courseId, courseId))
    );

    // Step 2: Curriculum Designer Agent
    const curriculum = await step.run('curriculum-designer', async () => {
      await db
        .update(CourseList)
        .set({ progress: 10, currentStep: 'Curriculum Designer analyzing topic...' })
        .where(eq(CourseList.courseId, courseId));

      return designCurriculum(category, topic, level, duration, numChapters);
    });

    // Step 3: Fact Checker Agent
    const factCheck = await step.run('fact-checker', async () => {
      await db
        .update(CourseList)
        .set({ progress: 20, currentStep: 'Fact Checker verifying accuracy...' })
        .where(eq(CourseList.courseId, courseId));

      return checkFacts(curriculum);
    });

    // Step 4: Pedagogical Expert Agent
    const pedagogy = await step.run('pedagogical-expert', async () => {
      await db
        .update(CourseList)
        .set({ progress: 30, currentStep: 'Pedagogical Expert optimizing learning path...' })
        .where(eq(CourseList.courseId, courseId));

      return reviewPedagogy(
        factCheck.adjustedChapters,
        curriculum.course.name,
        curriculum.course.description
      );
    });

    // Step 5: Save course outline
    const finalChapters = pedagogy.finalChapters;
    const courseOutput = {
      course: {
        name: curriculum.course.name,
        description: curriculum.course.description,
        noOfChapters: finalChapters.length,
        duration: curriculum.course.duration,
        chapters: finalChapters.map((ch) => ({
          name: ch.name,
          about: ch.about,
          duration: ch.duration,
        })),
      },
    };

    await step.run('save-course-outline', () =>
      db
        .update(CourseList)
        .set({
          courseOutput,
          status: 'generating_chapters',
          progress: 35,
          currentStep: 'Generating chapter content...',
        })
        .where(eq(CourseList.courseId, courseId))
    );

    // Step 6: Generate content for each chapter
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

    // Step 7: Mark as complete
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

    return {
      courseId,
      status: 'complete',
      agentsUsed: ['curriculum-designer', 'fact-checker', 'pedagogical-expert'],
      verified: factCheck.verified,
      difficultyAdjustments: pedagogy.difficultyAdjustments.length,
      quizTopicsGenerated: pedagogy.quizPrompts.length,
    };
  }
);
