import { generateObject } from 'ai';
import { getModel } from '../models';
import { z } from 'zod';
import type { CurriculumDesign } from './types';

const ChapterOutlineSchema = z.object({
  name: z.string().describe('The name of the chapter'),
  about: z.string().describe('A brief description of what the chapter covers'),
  duration: z.string().describe('Estimated time to complete the chapter'),
  learningObjectives: z
    .array(z.string())
    .describe('3-5 specific learning objectives for this chapter'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Difficulty level'),
  prerequisites: z
    .array(z.string())
    .describe('Chapter names that should be completed before this one'),
});

const CurriculumDesignSchema = z.object({
  course: z.object({
    name: z.string().describe('The name of the course'),
    description: z.string().describe('A comprehensive description of the course'),
    noOfChapters: z.number().describe('Number of chapters in the course'),
    duration: z.string().describe('Total estimated duration of the course'),
    chapters: z.array(ChapterOutlineSchema).describe('List of chapters in the course'),
    learningObjectives: z
      .array(z.string())
      .describe('3-5 top-level learning objectives for the entire course'),
  }),
});

/**
 * Curriculum Designer Agent
 * Generates a structured chapter outline with learning objectives, difficulty levels, and prerequisites.
 */
export async function designCurriculum(
  category: string,
  topic: string,
  level: string,
  duration: string,
  numChapters: number
): Promise<CurriculumDesign> {
  const model = getModel('gemini-2.0-flash');

  const { object } = await generateObject({
    model,
    schema: CurriculumDesignSchema,
    prompt: `You are an expert curriculum designer. Design a comprehensive course tutorial with the following details:

Category: ${category}
Topic: ${topic}
Target Level: ${level}
Total Duration: ${duration}
Number of Chapters: ${numChapters}

Requirements:
- Each chapter must have 3-5 specific, measurable learning objectives
- Assign appropriate difficulty levels (beginner/intermediate/advanced) that progress logically
- Define prerequisite chapters where knowledge builds upon previous chapters
- The course description should be comprehensive and accurate
- Chapter durations should sum to approximately the total course duration
- Learning objectives should use action verbs (understand, implement, analyze, etc.)

Generate the course layout in JSON format.`,
  });

  return object as CurriculumDesign;
}
