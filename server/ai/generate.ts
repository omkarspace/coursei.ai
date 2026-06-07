import { generateObject } from 'ai';
import { aiModel } from './models';
import {
  ChapterContentSchema,
  QuizSchema,
  FlashcardsSchema,
  StudyNotesSchema,
} from './schemas';
import type { ChapterContent, Quiz, Flashcards, StudyNotes } from './schemas';

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
