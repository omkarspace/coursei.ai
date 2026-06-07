'use server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { FlashcardReviews, Flashcards, type ReviewRating } from '@/server/db/schema';
import { and, eq, lte, sql } from 'drizzle-orm';
import { createEmptyCardState, scheduleCard, type FSRSState } from '@/server/ai/fsrs';
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
  const next = scheduleCard(prevState, rating, now);

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
      // Duplicate (userId, courseId, chapterId, cardIndex) — ignore
    }
  }

  await invalidateCache(`fsrs:${userId}:${courseId}`);
}
