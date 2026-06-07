import {
  boolean,
  integer,
  json,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===== Course Output Types =====
export interface Chapter {
  name: string;
  about: string;
  duration: string;
}

export interface CourseOutput {
  course: {
    name: string;
    description: string;
    noOfChapters: number;
    duration: string;
    chapters: Chapter[];
  };
}

export interface ChapterContent {
  title: string;
  explanation: string;
  code: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export type CardStateValue = 0 | 1 | 2 | 3;
export type ReviewRating = 1 | 2 | 3 | 4;

export interface CardState {
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: CardStateValue;
  lastReview: string | null;
}

export interface StudyNotes {
  summary: string;
  keyPoints: string[];
  importantTerms: { term: string; definition: string }[];
}

// ===== Course Generation Status =====
export type CourseStatus =
  | 'draft'
  | 'generating_outline'
  | 'outline_ready'
  | 'generating_chapters'
  | 'complete'
  | 'failed';

// ===== Tables =====

export const CourseList = pgTable('CourseList', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull().unique(),
  name: varchar('name').notNull(),
  category: varchar('category').notNull(),
  level: varchar('level').notNull(),
  includeVideo: varchar('includeVideo').notNull().default('Yes'),
  courseOutput: json('courseOutput').notNull().$type<CourseOutput>(),
  createdBy: varchar('createdBy').notNull(),
  userName: varchar('username'),
  userProfileImage: varchar('userProfileImage'),
  courseBanner: varchar('courseBanner').default('/placeholderr.png'),
  publish: boolean('publish').default(false),
  status: varchar('status').$type<CourseStatus>().notNull().default('draft'),
  progress: integer('progress').notNull().default(0),
  currentStep: varchar('currentStep'),
  generationError: text('generationError'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  vectorIndexedAt: timestamp('vectorIndexedAt'),
});

export const Chapters = pgTable('chapters', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull(),
  chapterId: integer('chapterId').notNull(),
  content: json('content').notNull().$type<ChapterContent[]>(),
  videoId: varchar('videoId').notNull().default(''),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const Quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull(),
  chapterId: integer('chapterId').notNull(),
  questions: json('questions').notNull().$type<QuizQuestion[]>(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const Flashcards = pgTable('flashcards', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull(),
  chapterId: integer('chapterId').notNull(),
  cards: json('cards').notNull().$type<Flashcard[]>(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const FlashcardReviews = pgTable('flashcard_reviews', {
  id: serial('id').primaryKey(),
  userId: varchar('userId').notNull(),
  courseId: varchar('courseId').notNull(),
  chapterId: integer('chapterId').notNull(),
  cardIndex: integer('cardIndex').notNull(),
  due: timestamp('due').notNull().defaultNow(),
  stability: real('stability').notNull().default(0),
  difficulty: real('difficulty').notNull().default(0),
  elapsedDays: integer('elapsedDays').notNull().default(0),
  scheduledDays: integer('scheduledDays').notNull().default(0),
  reps: integer('reps').notNull().default(0),
  lapses: integer('lapses').notNull().default(0),
  state: integer('state').notNull().default(0),
  lastReview: timestamp('lastReview'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const StudyNotesTable = pgTable('study_notes', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull(),
  chapterId: integer('chapterId').notNull(),
  notes: json('notes').notNull().$type<StudyNotes>(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const UserProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: varchar('userId').notNull(),
  courseId: varchar('courseId').notNull(),
  chapterId: integer('chapterId').notNull(),
  completed: boolean('completed').notNull().default(false),
  lastAccessedAt: timestamp('lastAccessedAt').defaultNow().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const CourseRatings = pgTable('course_ratings', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull(),
  userId: varchar('userId').notNull(),
  rating: integer('rating').notNull(),
  review: text('review'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const UserFSRSWeights = pgTable('user_fsrs_weights', {
  id: serial('id').primaryKey(),
  userId: varchar('userId').notNull(),
  courseId: varchar('courseId').notNull(),
  weights: real('weights').array().notNull().default([
    0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544,
    1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567, 0.0,
    1.1986, 0.1464, 0.1045, 0.0824, 0.0831,
  ]),
  optimizedAt: timestamp('optimizedAt'),
  reviewCount: integer('reviewCount').notNull().default(0),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// ===== Relations =====

export const courseListRelations = relations(CourseList, ({ many }) => ({
  chapters: many(Chapters),
  quizzes: many(Quizzes),
  flashcards: many(Flashcards),
  studyNotes: many(StudyNotesTable),
  progress: many(UserProgress),
  ratings: many(CourseRatings),
  userFSRSWeights: many(UserFSRSWeights),
}));

export const chaptersRelations = relations(Chapters, ({ one }) => ({
  course: one(CourseList, {
    fields: [Chapters.courseId],
    references: [CourseList.courseId],
  }),
}));

export const quizzesRelations = relations(Quizzes, ({ one }) => ({
  course: one(CourseList, {
    fields: [Quizzes.courseId],
    references: [CourseList.courseId],
  }),
}));

export const flashcardsRelations = relations(Flashcards, ({ one }) => ({
  course: one(CourseList, {
    fields: [Flashcards.courseId],
    references: [CourseList.courseId],
  }),
}));

export const flashcardReviewsRelations = relations(FlashcardReviews, ({ one }) => ({
  course: one(CourseList, {
    fields: [FlashcardReviews.courseId],
    references: [CourseList.courseId],
  }),
}));

export const studyNotesRelations = relations(StudyNotesTable, ({ one }) => ({
  course: one(CourseList, {
    fields: [StudyNotesTable.courseId],
    references: [CourseList.courseId],
  }),
}));

export const userProgressRelations = relations(UserProgress, ({ one }) => ({
  course: one(CourseList, {
    fields: [UserProgress.courseId],
    references: [CourseList.courseId],
  }),
}));

export const courseRatingsRelations = relations(CourseRatings, ({ one }) => ({
  course: one(CourseList, {
    fields: [CourseRatings.courseId],
    references: [CourseList.courseId],
  }),
}));

export const userFSRSWeightsRelations = relations(UserFSRSWeights, ({ one }) => ({
  course: one(CourseList, {
    fields: [UserFSRSWeights.courseId],
    references: [CourseList.courseId],
  }),
}));
