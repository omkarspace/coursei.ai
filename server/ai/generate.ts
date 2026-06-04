import { generateObject } from 'ai';
import { aiModel } from './models';
import {
  CourseLayoutSchema,
  ChapterContentSchema,
  QuizSchema,
  FlashcardsSchema,
  StudyNotesSchema,
} from './schemas';
import type { CourseLayout, ChapterContent, Quiz, Flashcards, StudyNotes } from './schemas';

// ===== Generate Course Layout =====
export async function generateCourseLayout(
  category: string,
  topic: string,
  level: string,
  duration: string,
  numChapters: number
): Promise<CourseLayout> {
  const { object } = await generateObject({
    model: aiModel,
    schema: CourseLayoutSchema,
    prompt: `Generate A Course Tutorial on Following Detail With field as Course Name, Description, Along with Chapter Name, about, Duration:
Category: ${category},
Topic: ${topic},
Level: ${level},
Duration: ${duration},
NoOf Chapters: ${numChapters}`,
  });

  return object;
}

// ===== Generate Chapter Content =====
export async function generateChapterContent(
  topic: string,
  chapterName: string
): Promise<ChapterContent> {
  const { object } = await generateObject({
    model: aiModel,
    schema: ChapterContentSchema,
    prompt: `Explain the concept in Detail on Topic: ${topic}, Chapter: ${chapterName}, in JSON Format with list of array with field as title, explanation on give chapter in details, Code Example (Code field in <precode> format) if applicable`,
  });

  return object;
}

// ===== Generate Quiz =====
export async function generateQuiz(chapterName: string, contentSummary: string): Promise<Quiz> {
  const { object } = await generateObject({
    model: aiModel,
    schema: QuizSchema,
    prompt: `Generate a quiz with 5 multiple choice questions based on the following chapter content. Chapter: ${chapterName}, Content: ${contentSummary}`,
  });

  return object;
}

// ===== Generate Flashcards =====
export async function generateFlashcards(
  chapterName: string,
  contentSummary: string
): Promise<Flashcards> {
  const { object } = await generateObject({
    model: aiModel,
    schema: FlashcardsSchema,
    prompt: `Generate 10 flashcards based on the following chapter content. Chapter: ${chapterName}, Content: ${contentSummary}`,
  });

  return object;
}

// ===== Generate Study Notes =====
export async function generateStudyNotes(
  chapterName: string,
  contentSummary: string
): Promise<StudyNotes> {
  const { object } = await generateObject({
    model: aiModel,
    schema: StudyNotesSchema,
    prompt: `Generate concise study notes for the following chapter. Chapter: ${chapterName}, Content: ${contentSummary}`,
  });

  return object;
}
