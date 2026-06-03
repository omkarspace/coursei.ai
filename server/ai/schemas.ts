import { z } from "zod";

// ===== Course Layout Schema =====
export const ChapterSchema = z.object({
  name: z.string().describe("The name of the chapter"),
  about: z.string().describe("A brief description of what the chapter covers"),
  duration: z.string().describe("Estimated time to complete the chapter"),
});

export const CourseLayoutSchema = z.object({
  course: z.object({
    name: z.string().describe("The name of the course"),
    description: z.string().describe("A comprehensive description of the course"),
    noOfChapters: z.number().describe("Number of chapters in the course"),
    duration: z.string().describe("Total estimated duration of the course"),
    chapters: z.array(ChapterSchema).describe("List of chapters in the course"),
  }),
});

// ===== Chapter Content Schema =====
export const ContentSectionSchema = z.object({
  title: z.string().describe("The title of this section"),
  explanation: z
    .string()
    .describe(
      "Detailed explanation of the topic. Use markdown formatting including code blocks, lists, and emphasis."
    ),
  code: z
    .string()
    .default("")
    .describe(
      "Code example if applicable, wrapped in <precode> tags. Empty string if no code."
    ),
});

export const ChapterContentSchema = z.array(ContentSectionSchema);

// ===== Quiz Schema =====
export const QuizQuestionSchema = z.object({
  question: z.string().describe("The quiz question"),
  options: z
    .array(z.string())
    .length(4)
    .describe("Four answer options"),
  correctAnswer: z
    .number()
    .min(0)
    .max(3)
    .describe("Index of the correct answer (0-3)"),
  explanation: z.string().describe("Explanation of why the answer is correct"),
});

export const QuizSchema = z.object({
  questions: z
    .array(QuizQuestionSchema)
    .describe("Array of quiz questions"),
});

// ===== Flashcards Schema =====
export const FlashcardSchema = z.object({
  front: z.string().describe("The question or term (front of card)"),
  back: z.string().describe("The answer or definition (back of card)"),
});

export const FlashcardsSchema = z.object({
  cards: z.array(FlashcardSchema).describe("Array of flashcards"),
});

// ===== Study Notes Schema =====
export const ImportantTermSchema = z.object({
  term: z.string().describe("The term or concept name"),
  definition: z.string().describe("Clear definition of the term"),
});

export const StudyNotesSchema = z.object({
  summary: z
    .string()
    .describe("2-3 paragraph overview of the chapter content"),
  keyPoints: z
    .array(z.string())
    .describe("5-7 main takeaways from the chapter"),
  importantTerms: z
    .array(ImportantTermSchema)
    .describe("Key terms and their definitions"),
});

// ===== Type exports =====
export type Chapter = z.infer<typeof ChapterSchema>;
export type CourseLayout = z.infer<typeof CourseLayoutSchema>;
export type ContentSection = z.infer<typeof ContentSectionSchema>;
export type ChapterContent = z.infer<typeof ChapterContentSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type Flashcard = z.infer<typeof FlashcardSchema>;
export type Flashcards = z.infer<typeof FlashcardsSchema>;
export type StudyNotes = z.infer<typeof StudyNotesSchema>;
