import { generateObject } from 'ai';
import { getModel } from '../models';
import { z } from 'zod';
import type { ChapterOutline, PedagogicalReview } from './types';

const QuizPromptSchema = z.object({
  chapterName: z.string().describe('The chapter name'),
  suggestedTopics: z.array(z.string()).describe('3-5 topics that would make good quiz questions'),
});

const CodeBlockPlaceholderSchema = z.object({
  chapterName: z.string().describe('The chapter name'),
  language: z.string().describe('Programming language for the code example'),
  description: z.string().describe('What the code example should demonstrate'),
});

const DifficultyAdjustmentSchema = z.object({
  chapterName: z.string().describe('The chapter name'),
  originalDifficulty: z.string().describe('The original difficulty level'),
  suggestedDifficulty: z.string().describe('The suggested difficulty level'),
  reason: z.string().describe('Why the adjustment is recommended'),
});

const PedagogicalReviewSchema = z.object({
  finalChapters: z
    .array(
      z.object({
        name: z.string(),
        about: z.string(),
        duration: z.string(),
        learningObjectives: z.array(z.string()),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
        prerequisites: z.array(z.string()),
      })
    )
    .describe('Final chapter list with any pedagogical adjustments'),
  quizPrompts: z.array(QuizPromptSchema).describe('Quiz topic suggestions per chapter'),
  codeBlockPlaceholders: z
    .array(CodeBlockPlaceholderSchema)
    .describe('Suggested code examples for chapters that benefit from them'),
  difficultyAdjustments: z
    .array(DifficultyAdjustmentSchema)
    .describe('Any difficulty level changes recommended'),
});

/**
 * Pedagogical Expert Agent
 * Adjusts reading levels, adds code block placeholders, and injects quiz ideas.
 */
export async function reviewPedagogy(
  chapters: ChapterOutline[],
  courseName: string,
  courseDescription: string
): Promise<PedagogicalReview> {
  const model = getModel('gemini-2.0-flash');

  const chapterSummaries = chapters
    .map(
      (ch, i) =>
        `Chapter ${i + 1}: ${ch.name}\nDescription: ${ch.about}\nDifficulty: ${ch.difficulty}\nObjectives: ${ch.learningObjectives.join(', ')}`
    )
    .join('\n\n');

  const { object } = await generateObject({
    model,
    schema: PedagogicalReviewSchema,
    prompt: `You are an expert pedagogical designer specializing in technical education. Review the following course curriculum and optimize it for effective learning.

Course: ${courseName}
Description: ${courseDescription}

Chapters:
${chapterSummaries}

Tasks:
1. Review difficulty levels and adjust if any chapter is too advanced/advanced for its position in the sequence
2. Suggest quiz topics for each chapter that test understanding (not just memorization)
3. Identify chapters that would benefit from code examples and suggest what they should demonstrate
4. Ensure the learning progression is smooth and logical
5. Verify that each chapter builds appropriately on its prerequisites

For difficulty adjustments, consider:
- First chapters should generally be beginner level
- Difficulty should increase gradually
- Advanced topics should have clear prerequisites

Generate the pedagogical review in JSON format.`,
  });

  return object as PedagogicalReview;
}
