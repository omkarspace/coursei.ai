'use server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { FlashcardReviews, Flashcards, UserFSRSWeights, QuizAttempts, QuizReviews, Quizzes, type ReviewRating } from '@/server/db/schema';
import { and, eq, lte, sql } from 'drizzle-orm';
import { createEmptyCardState, scheduleCard, type FSRSState, optimizeWeights, DEFAULT_WEIGHTS } from '@/server/ai/fsrs';
import { invalidateCache } from '@/server/services/cache';
import { revalidatePath } from 'next/cache';

export interface DueCard {
  reviewId: number;
  courseId: string;
  chapterId: number;
  cardIndex: number;
  card: { front: string; back: string };
}

export async function getDueFlashcardsAction(courseId?: string): Promise<DueCard[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const now = new Date();
  const reviews = await db
    .select()
    .from(FlashcardReviews)
    .where(
      and(
        eq(FlashcardReviews.userId, userId),
        lte(FlashcardReviews.due, now),
        courseId ? eq(FlashcardReviews.courseId, courseId) : sql`true`
      )
    )
    .orderBy(FlashcardReviews.due)
    .limit(20);

  if (reviews.length === 0) return [];

  const chapterKeys = reviews.map((r) => ({ courseId: r.courseId, chapterId: r.chapterId }));
  const uniqueKeys = Array.from(
    new Set(chapterKeys.map((k) => `${k.courseId}::${k.chapterId}`))
  );
  const flashcardRows = await Promise.all(
    uniqueKeys.map(async (key) => {
      const [cId, chId] = key.split('::');
      const rows = await db
        .select()
        .from(Flashcards)
        .where(and(eq(Flashcards.courseId, cId!), eq(Flashcards.chapterId, Number(chId!))));
      return rows[0];
    })
  );
  const flashcardMap = new Map(
    flashcardRows.filter(Boolean).map((f) => [`${f!.courseId}::${f!.chapterId}`, f!])
  );

  return reviews.map((r) => {
    const fc = flashcardMap.get(`${r.courseId}::${r.chapterId}`);
    return {
      reviewId: r.id,
      courseId: r.courseId,
      chapterId: r.chapterId,
      cardIndex: r.cardIndex,
      card: fc?.cards?.[r.cardIndex] ?? { front: '', back: '' },
    };
  });
}

export async function getDueCountAction(userId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<string>`count(*)::text` })
    .from(FlashcardReviews)
    .where(and(eq(FlashcardReviews.userId, userId), lte(FlashcardReviews.due, new Date())));
  return Number(rows[0]?.count ?? 0);
}

export async function getReviewStreakAction(userId: string): Promise<number> {
  const rows = await db
    .select({ day: sql<string>`to_char(${FlashcardReviews.lastReview}, 'YYYY-MM-DD')` })
    .from(FlashcardReviews)
    .where(and(eq(FlashcardReviews.userId, userId), sql`${FlashcardReviews.lastReview} IS NOT NULL`))
    .groupBy(sql`to_char(${FlashcardReviews.lastReview}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${FlashcardReviews.lastReview}, 'YYYY-MM-DD') DESC`)
    .limit(365);

  if (rows.length === 0) return 0;

  const days = new Set(rows.map((r) => r.day));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let cursor: Date;
  if (days.has(todayStr)) cursor = today;
  else if (days.has(yesterdayStr)) cursor = yesterday;
  else return 0;

  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function submitFlashcardReviewAction(
  reviewId: number,
  rating: ReviewRating
): Promise<{ nextDue: string; state: number }> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const rows = await db
    .select()
    .from(FlashcardReviews)
    .where(eq(FlashcardReviews.id, reviewId));
  const prev = rows[0];
  if (!prev) throw new Error('Review not found');
  if (prev.userId !== userId) throw new Error('Forbidden');

  const weightsRows = await db
    .select()
    .from(UserFSRSWeights)
    .where(and(eq(UserFSRSWeights.userId, userId), eq(UserFSRSWeights.courseId, prev.courseId)));
  const weights = (weightsRows[0]?.weights as number[] | undefined) ?? [...DEFAULT_WEIGHTS];

  const prevState: FSRSState = {
    due: prev.due.toISOString(),
    stability: prev.stability,
    difficulty: prev.difficulty,
    elapsedDays: prev.elapsedDays,
    scheduledDays: prev.scheduledDays,
    reps: prev.reps,
    lapses: prev.lapses,
    state: prev.state as 0 | 1 | 2 | 3,
    lastReview: prev.lastReview ? prev.lastReview.toISOString() : null,
  };
  const now = createEmptyCardState();
  const next = scheduleCard(prevState, rating, now, weights);

  await db
    .update(FlashcardReviews)
    .set({
      due: new Date(next.due),
      stability: next.stability,
      difficulty: next.difficulty,
      elapsedDays: next.elapsedDays,
      scheduledDays: next.scheduledDays,
      reps: next.reps,
      lapses: next.lapses,
      state: next.state,
      lastReview: next.lastReview ? new Date(next.lastReview) : null,
      updatedAt: new Date(),
    })
    .where(eq(FlashcardReviews.id, reviewId));

  await db
    .update(UserFSRSWeights)
    .set({
      reviewCount: sql`${UserFSRSWeights.reviewCount} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(eq(UserFSRSWeights.userId, userId), eq(UserFSRSWeights.courseId, prev.courseId))
    );

  revalidatePath('/dashboard');
  return { nextDue: next.due, state: next.state };
}

export async function ensureFlashcardsEnrolledAction(
  courseId: string,
  chapterId: number,
  cardCount: number
): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  for (let cardIndex = 0; cardIndex < cardCount; cardIndex++) {
    try {
      await db
        .insert(FlashcardReviews)
        .values({
          userId,
          courseId,
          chapterId,
          cardIndex,
        });
    } catch {
      // Duplicate — ignore
    }
  }

  const weightsRows = await db
    .select()
    .from(UserFSRSWeights)
    .where(and(eq(UserFSRSWeights.userId, userId), eq(UserFSRSWeights.courseId, courseId)));

  if (weightsRows.length === 0) {
    await db.insert(UserFSRSWeights).values({
      userId,
      courseId,
      weights: [...DEFAULT_WEIGHTS],
    });
  }

  await invalidateCache(`fsrs:${userId}:${courseId}`);
}

export async function getWeightsAction(courseId: string): Promise<number[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const rows = await db
    .select()
    .from(UserFSRSWeights)
    .where(and(eq(UserFSRSWeights.userId, userId), eq(UserFSRSWeights.courseId, courseId)));

  if (rows.length > 0 && rows[0]) {
    return rows[0].weights as number[];
  }

  await db.insert(UserFSRSWeights).values({
    userId,
    courseId,
    weights: [...DEFAULT_WEIGHTS],
  });

  return [...DEFAULT_WEIGHTS];
}

export async function optimizeWeightsAction(
  courseId: string
): Promise<{ optimized: boolean; reviewCount: number }> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const rows = await db
    .select()
    .from(UserFSRSWeights)
    .where(and(eq(UserFSRSWeights.userId, userId), eq(UserFSRSWeights.courseId, courseId)));

  const userWeights = rows[0];
  const reviewCount = userWeights?.reviewCount ?? 0;

  if (reviewCount < 10) {
    return { optimized: false, reviewCount };
  }

  const reviews = await db
    .select()
    .from(FlashcardReviews)
    .where(and(eq(FlashcardReviews.userId, userId), eq(FlashcardReviews.courseId, courseId)));

  const records = reviews.map((r) => ({
    rating: r.state === 0 ? (3 as ReviewRating) : r.reps > 0 ? (3 as ReviewRating) : (3 as ReviewRating),
    state: r.state as 0 | 1 | 2 | 3,
    stability: r.stability,
    difficulty: r.difficulty,
    elapsedDays: r.elapsedDays,
  }));

  const optimized = optimizeWeights(records);

  if (userWeights) {
    await db
      .update(UserFSRSWeights)
      .set({
        weights: optimized,
        optimizedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(UserFSRSWeights.id, userWeights.id));
  } else {
    await db.insert(UserFSRSWeights).values({
      userId,
      courseId,
      weights: optimized,
      optimizedAt: new Date(),
      reviewCount,
    });
  }

  return { optimized: true, reviewCount };
}

export async function saveQuizAttemptAction(
  courseId: string,
  chapterId: number,
  score: number,
  totalQuestions: number,
  answers: { questionIndex: number; selectedAnswer: number; isCorrect: boolean }[]
): Promise<{ attemptId: number }> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const [attempt] = await db
    .insert(QuizAttempts)
    .values({ userId, courseId, chapterId, score, totalQuestions, answers })
    .returning({ id: QuizAttempts.id });

  for (const answer of answers) {
    const rating: ReviewRating = answer.isCorrect ? 3 : 1;
    const existing = await db
      .select()
      .from(QuizReviews)
      .where(
        and(
          eq(QuizReviews.userId, userId),
          eq(QuizReviews.courseId, courseId),
          eq(QuizReviews.chapterId, chapterId),
          eq(QuizReviews.questionIndex, answer.questionIndex)
        )
      );

    if (existing.length > 0 && existing[0]) {
      const prev = existing[0];
      const prevState: FSRSState = {
        due: prev.due.toISOString(),
        stability: prev.stability,
        difficulty: prev.difficulty,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: prev.reps,
        lapses: prev.lapses,
        state: prev.state as 0 | 1 | 2 | 3,
        lastReview: prev.lastReview ? prev.lastReview.toISOString() : null,
      };
      const now = createEmptyCardState();
      const next = scheduleCard(prevState, rating, now);
      await db
        .update(QuizReviews)
        .set({
          due: new Date(next.due),
          stability: next.stability,
          difficulty: next.difficulty,
          reps: next.reps,
          lapses: next.lapses,
          state: next.state,
          lastReview: next.lastReview ? new Date(next.lastReview) : null,
          updatedAt: new Date(),
        })
        .where(eq(QuizReviews.id, prev.id));
    } else {
      const initState = createEmptyCardState();
      const next = scheduleCard(initState, rating, initState);
      await db.insert(QuizReviews).values({
        userId, courseId, chapterId,
        questionIndex: answer.questionIndex,
        state: next.state,
        stability: next.stability,
        difficulty: next.difficulty,
        due: new Date(next.due),
        reps: next.reps,
        lapses: next.lapses,
        lastReview: next.lastReview ? new Date(next.lastReview) : null,
      });
    }
  }

  revalidatePath('/dashboard');
  return { attemptId: attempt?.id ?? 0 };
}

export interface DueQuizQuestion {
  questionIndex: number;
  question: string;
  options: string[];
  explanation: string;
}

export async function getDueQuizQuestionsAction(
  courseId: string,
  chapterId: number
): Promise<DueQuizQuestion[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const now = new Date();
  const dueReviews = await db
    .select()
    .from(QuizReviews)
    .where(
      and(
        eq(QuizReviews.userId, userId),
        eq(QuizReviews.courseId, courseId),
        eq(QuizReviews.chapterId, chapterId),
        lte(QuizReviews.due, now)
      )
    )
    .orderBy(QuizReviews.due)
    .limit(20);

  if (dueReviews.length === 0) return [];

  const quizRows = await db
    .select()
    .from(Quizzes)
    .where(and(eq(Quizzes.courseId, courseId), eq(Quizzes.chapterId, chapterId)));

  const quiz = quizRows[0];
  if (!quiz) return [];

  return dueReviews
    .map((review) => {
      const q = (quiz.questions as { question: string; options: string[]; explanation: string }[])[
        review.questionIndex
      ];
      if (!q) return null;
      return {
        questionIndex: review.questionIndex,
        question: q.question,
        options: q.options,
        explanation: q.explanation,
      };
    })
    .filter(Boolean) as DueQuizQuestion[];
}

export async function submitQuizReviewAction(
  courseId: string,
  chapterId: number,
  questionIndex: number,
  rating: ReviewRating
): Promise<{ nextDue: string; state: number }> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const rows = await db
    .select()
    .from(QuizReviews)
    .where(
      and(
        eq(QuizReviews.userId, userId),
        eq(QuizReviews.courseId, courseId),
        eq(QuizReviews.chapterId, chapterId),
        eq(QuizReviews.questionIndex, questionIndex)
      )
    );

  const prev = rows[0];
  if (!prev) throw new Error('Quiz review not found');

  const prevState: FSRSState = {
    due: prev.due.toISOString(),
    stability: prev.stability,
    difficulty: prev.difficulty,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: prev.reps,
    lapses: prev.lapses,
    state: prev.state as 0 | 1 | 2 | 3,
    lastReview: prev.lastReview ? prev.lastReview.toISOString() : null,
  };
  const now = createEmptyCardState();
  const next = scheduleCard(prevState, rating, now);

  await db
    .update(QuizReviews)
    .set({
      due: new Date(next.due),
      stability: next.stability,
      difficulty: next.difficulty,
      reps: next.reps,
      lapses: next.lapses,
      state: next.state,
      lastReview: next.lastReview ? new Date(next.lastReview) : null,
      updatedAt: new Date(),
    })
    .where(eq(QuizReviews.id, prev.id));

  revalidatePath('/dashboard');
  return { nextDue: next.due, state: next.state };
}

export async function getQuizAttemptHistoryAction(
  courseId: string,
  chapterId: number
): Promise<{ id: number; score: number; totalQuestions: number; createdAt: Date }[]> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  return db
    .select({
      id: QuizAttempts.id,
      score: QuizAttempts.score,
      totalQuestions: QuizAttempts.totalQuestions,
      createdAt: QuizAttempts.createdAt,
    })
    .from(QuizAttempts)
    .where(
      and(
        eq(QuizAttempts.userId, userId),
        eq(QuizAttempts.courseId, courseId),
        eq(QuizAttempts.chapterId, chapterId)
      )
    )
    .orderBy(sql`${QuizAttempts.createdAt} DESC`)
    .limit(20);
}

export async function getDueQuizCountAction(courseId?: string): Promise<number> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const now = new Date();
  const rows = await db
    .select({ count: sql<string>`count(*)::text` })
    .from(QuizReviews)
    .where(
      and(
        eq(QuizReviews.userId, userId),
        lte(QuizReviews.due, now),
        courseId ? eq(QuizReviews.courseId, courseId) : sql`true`
      )
    );
  return Number(rows[0]?.count ?? 0);
}
