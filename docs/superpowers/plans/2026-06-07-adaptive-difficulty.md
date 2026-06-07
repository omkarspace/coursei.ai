# Adaptive Difficulty Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded FSRS-4.1 weights with per-user optimized weights that adapt to each learner's recall patterns.

**Architecture:** New `user_fsrs_weights` table stores per-user, per-course weight vectors. All FSRS functions accept a `weights` parameter. After every 20 reviews, run FSRS parameter optimizer (grid search) on user's review history to minimize RMSE between predicted and actual recall.

**Tech Stack:** Drizzle ORM, PostgreSQL, FSRS-4.1 algorithm, Vitest, server actions

---

## File Map

| Action | File |
|--------|------|
| Create | `server/db/schema.ts` — add `UserFSRSWeights` table + TS interface |
| Modify | `server/ai/fsrs.ts` — add `weights` param to all functions, add `getUserWeights`, `optimizeWeights`, `DEFAULT_WEIGHTS` |
| Modify | `app/actions/fsrs.ts` — add `getWeightsAction`, `optimizeWeightsAction`, modify `submitFlashcardReviewAction` to use per-user weights |
| Modify | `app/actions/optimize-weights.ts` (new) — weight optimization action |
| Modify | `__tests__/ai/fsrs.test.ts` — add adaptive weight tests |
| Modify | `__tests__/ai/adaptive-fsrs.test.ts` (new) — integration tests for weight optimization |

---

### Task 1: Add `UserFSRSWeights` table to schema

**Files:**
- Modify: `server/db/schema.ts:1-12` (imports), `server/db/schema.ts:165-172` (new table), `server/db/schema.ts:226-232` (relations)

- [ ] **Step 1: Add `array` import to schema**

In `server/db/schema.ts`, add `array` to the drizzle-orm imports:

```ts
import {
  array,
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
```

- [ ] **Step 2: Add `UserFSRSWeights` table**

Add after `CourseRatings` table (around line 172):

```ts
export const UserFSRSWeights = pgTable('user_fsrs_weights', {
  id: serial('id').primaryKey(),
  userId: varchar('userId').notNull(),
  courseId: varchar('courseId').notNull(),
  weights: array('weights').of(real()).notNull().default([
    0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544,
    1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567, 0.0,
    1.1986, 0.1464, 0.1045, 0.0824, 0.0831,
  ]),
  optimizedAt: timestamp('optimizedAt'),
  reviewCount: integer('reviewCount').notNull().default(0),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});
```

- [ ] **Step 3: Add `userFSRSWeightsRelations`**

Add after `courseRatingsRelations`:

```ts
export const userFSRSWeightsRelations = relations(UserFSRSWeights, ({ one }) => ({
  course: one(CourseList, {
    fields: [UserFSRSWeights.courseId],
    references: [CourseList.courseId],
  }),
}));
```

- [ ] **Step 4: Run `npm run db:push`**

```bash
npm run db:push
```

Expected: Table `user_fsrs_weights` created successfully.

- [ ] **Step 5: Commit**

```bash
git add server/db/schema.ts
git commit -m "feat(db): add user_fsrs_weights table for adaptive difficulty"
```

---

### Task 2: Add `DEFAULT_WEIGHTS` constant and refactor `fsrs.ts`

**Files:**
- Modify: `server/ai/fsrs.ts:1-25` (exports), `server/ai/fsrs.ts:27-72` (all functions)

- [ ] **Step 1: Export `DEFAULT_WEIGHTS` and refactor functions to accept weights parameter**

Replace the entire `server/ai/fsrs.ts` with:

```ts
import type { CardStateValue, ReviewRating } from '@/server/db/schema';

export type FSRSState = {
  due: string;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: CardStateValue;
  lastReview: string | null;
};

export const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_WEIGHTS = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544,
  1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567, 0.0,
  1.1986, 0.1464, 0.1045, 0.0824, 0.0831,
] as const;

const RATING: Record<ReviewRating, number> = { 1: 1, 2: 2, 3: 3, 4: 4 };

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function forgettingCurve(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

export function nextInterval(
  s: number,
  elapsedDays: number,
  desiredRetention = 0.9
): number {
  if (s <= 0) return 1;
  return Math.max(
    1,
    Math.round((s / 9) * (Math.pow(desiredRetention, -1 / 9) - 1) - elapsedDays)
  );
}

export function nextDifficulty(d: number, rating: number, weights: readonly number[] = DEFAULT_WEIGHTS): number {
  const w = (i: number) => weights[i] ?? 0;
  return clamp(d - w(6) * (rating - 3), 1, 10);
}

export function nextRecallStability(
  d: number,
  s: number,
  r: number,
  weights: readonly number[] = DEFAULT_WEIGHTS
): number {
  const w = (i: number) => weights[i] ?? 0;
  return (
    s *
    (1 +
      Math.exp(w(8)) *
        (11 - d) *
        Math.pow(s, -w(9)) *
        (Math.exp((1 - r) * w(10)) - 1))
  );
}

export function nextForgetStability(
  d: number,
  s: number,
  r: number,
  weights: readonly number[] = DEFAULT_WEIGHTS
): number {
  const w = (i: number) => weights[i] ?? 0;
  return (
    w(11) * Math.pow(d, -w(12)) * (Math.pow(s + 1, w(13)) - 1) * Math.exp((1 - r) * w(14))
  );
}

function initStability(r: number, weights: readonly number[] = DEFAULT_WEIGHTS): number {
  const w = (i: number) => weights[i] ?? 0;
  return Math.max(w(0), (w(1) * Math.pow(r, -w(2)) * Math.exp(w(3) * 1)) || w(0));
}

function initDifficulty(r: number, weights: readonly number[] = DEFAULT_WEIGHTS): number {
  const w = (i: number) => weights[i] ?? 0;
  return clamp(w(4) - Math.exp(w(5) * 1) * (r - 1) + 1, 1, 10);
}

function shortTermStability(s: number, r: number, weights: readonly number[] = DEFAULT_WEIGHTS): number {
  const w = (i: number) => weights[i] ?? 0;
  return s * Math.exp(w(17) * (r - 3 + w(18)));
}

export function createEmptyCardState(): FSRSState {
  return {
    due: new Date().toISOString(),
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    lastReview: null,
  };
}

export function scheduleCard(
  prev: FSRSState,
  rating: ReviewRating,
  now: FSRSState,
  weights: readonly number[] = DEFAULT_WEIGHTS
): FSRSState {
  const elapsedDays = prev.lastReview
    ? Math.max(
        0,
        Math.round(
          (new Date(now.due).getTime() - new Date(prev.lastReview).getTime()) / DAY_MS
        )
      )
    : 0;
  const r = RATING[rating];

  if (prev.state === 0) {
    const difficulty = prev.difficulty > 0 ? prev.difficulty : initDifficulty(r, weights);
    const stability = prev.stability > 0 ? prev.stability : initStability(r, weights);

    if (rating === 1) {
      return {
        ...prev,
        difficulty,
        stability,
        state: 1,
        reps: prev.reps + 1,
        lastReview: now.due,
        due: new Date(Date.now() + 60_000).toISOString(),
        elapsedDays: 0,
        scheduledDays: 0,
      };
    }
    if (rating === 2 || rating === 3) {
      const minutes = rating === 2 ? 5 : 10;
      return {
        ...prev,
        difficulty,
        stability,
        state: 1,
        reps: prev.reps + 1,
        lastReview: now.due,
        due: new Date(Date.now() + minutes * 60_000).toISOString(),
        elapsedDays: 0,
        scheduledDays: 0,
      };
    }
    const s = shortTermStability(stability, r, weights);
    return {
      ...prev,
      difficulty,
      stability: s,
      state: 2,
      reps: prev.reps + 1,
      lastReview: now.due,
      scheduledDays: nextInterval(s, 0),
      due: new Date(Date.now() + nextInterval(s, 0) * DAY_MS).toISOString(),
      elapsedDays: 0,
    };
  }

  if (prev.state === 1 || prev.state === 3) {
    if (rating === 1) {
      return {
        ...prev,
        state: prev.state,
        reps: prev.reps + 1,
        lapses: prev.state === 3 ? prev.lapses + 1 : prev.lapses,
        lastReview: now.due,
        due: new Date(Date.now() + 60_000).toISOString(),
      };
    }
    if (rating === 2 || rating === 3) {
      const s = shortTermStability(prev.stability || 1, r, weights);
      return {
        ...prev,
        stability: s,
        state: 2,
        reps: prev.reps + 1,
        lastReview: now.due,
        scheduledDays: nextInterval(s, 0),
        due: new Date(Date.now() + nextInterval(s, 0) * DAY_MS).toISOString(),
        elapsedDays: 0,
      };
    }
    const s = shortTermStability(prev.stability || 1, r, weights) * 1.3;
    return {
      ...prev,
      stability: s,
      state: 2,
      reps: prev.reps + 1,
      lastReview: now.due,
      scheduledDays: nextInterval(s, 0),
      due: new Date(Date.now() + nextInterval(s, 0) * DAY_MS).toISOString(),
      elapsedDays: 0,
    };
  }

  const recall = forgettingCurve(elapsedDays, prev.stability || 1);
  if (rating === 1) {
    const s = nextForgetStability(prev.difficulty, prev.stability, recall, weights);
    return {
      ...prev,
      stability: s,
      state: 3,
      lapses: prev.lapses + 1,
      reps: prev.reps + 1,
      lastReview: now.due,
      due: new Date(Date.now() + 10 * 60_000).toISOString(),
      scheduledDays: 0,
      elapsedDays,
    };
  }
  const newDifficulty = nextDifficulty(prev.difficulty, r, weights);
  const newStability = nextRecallStability(newDifficulty, prev.stability, recall, weights);
  const interval = nextInterval(newStability, elapsedDays);
  return {
    ...prev,
    stability: newStability,
    difficulty: newDifficulty,
    state: 2,
    reps: prev.reps + 1,
    lastReview: now.due,
    scheduledDays: interval,
    due: new Date(Date.now() + interval * DAY_MS).toISOString(),
    elapsedDays,
  };
}
```

- [ ] **Step 6: Run existing FSRS tests to verify no regressions**

Run: `npm test -- __tests__/ai/fsrs.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 7: Commit**

```bash
git add server/ai/fsrs.ts
git commit -m "refactor(fsrs): export DEFAULT_WEIGHTS, add weights parameter to all functions"
```

---

### Task 3: Add weight optimizer to `fsrs.ts`

**Files:**
- Modify: `server/ai/fsrs.ts` (append after `scheduleCard`)

- [ ] **Step 1: Add `optimizeWeights` function**

Append to `server/ai/fsrs.ts`:

```ts
export interface ReviewRecord {
  rating: ReviewRating;
  state: CardStateValue;
  stability: number;
  difficulty: number;
  elapsedDays: number;
}

function computeRmse(weights: readonly number[], reviews: ReviewRecord[]): number {
  let sumSquaredError = 0;
  for (const review of reviews) {
    const recall = forgettingCurve(review.elapsedDays, review.stability);
    let predictedRetention: number;
    if (review.state === 0 || review.state === 1 || review.state === 3) {
      predictedRetention = review.rating >= 3 ? 0.9 : 0.3;
    } else {
      const newD = nextDifficulty(review.difficulty, review.rating, weights);
      const newS = nextRecallStability(newD, review.stability, recall, weights);
      predictedRetention = Math.min(1, newS / (review.stability || 1));
    }
    const actualRetention = review.rating >= 3 ? 1 : 0;
    sumSquaredError += Math.pow(predictedRetention - actualRetention, 2);
  }
  return Math.sqrt(sumSquaredError / reviews.length);
}

export function optimizeWeights(reviews: ReviewRecord[]): number[] {
  if (reviews.length < 5) return [...DEFAULT_WEIGHTS];

  let bestWeights = [...DEFAULT_WEIGHTS];
  let bestRmse = computeRmse(bestWeights, reviews);

  const weightIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

  for (const idx of weightIndices) {
    const original = bestWeights[idx]!;
    const step = original * 0.1 || 0.01;

    for (const delta of [-step, step]) {
      const candidate = [...bestWeights];
      candidate[idx] = original + delta;
      const rmse = computeRmse(candidate, reviews);
      if (rmse < bestRmse) {
        bestRmse = rmse;
        bestWeights = candidate;
      }
    }
  }

  return bestWeights;
}
```

- [ ] **Step 2: Run tests to verify no regressions**

Run: `npm test -- __tests__/ai/fsrs.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 3: Commit**

```bash
git add server/ai/fsrs.ts
git commit -m "feat(fsrs): add optimizeWeights parameter optimizer"
```

---

### Task 4: Add `getWeightsAction` and `optimizeWeightsAction` server actions

**Files:**
- Modify: `app/actions/fsrs.ts:1-8` (imports), `app/actions/fsrs.ts` (append new actions)

- [ ] **Step 1: Add imports**

In `app/actions/fsrs.ts`, update imports:

```ts
'use server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { FlashcardReviews, Flashcards, UserFSRSWeights, type ReviewRating } from '@/server/db/schema';
import { and, eq, lte, sql } from 'drizzle-orm';
import { createEmptyCardState, scheduleCard, type FSRSState, optimizeWeights, DEFAULT_WEIGHTS } from '@/server/ai/fsrs';
import { invalidateCache } from '@/server/services/cache';
import { revalidatePath } from 'next/cache';
```

- [ ] **Step 2: Add `getWeightsAction`**

Append to `app/actions/fsrs.ts`:

```ts
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
```

- [ ] **Step 3: Add `optimizeWeightsAction`**

Append to `app/actions/fsrs.ts`:

```ts
export async function optimizeWeightsAction(courseId: string): Promise<{ optimized: boolean; reviewCount: number }> {
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
    rating: r.state === 0 ? (3 as ReviewRating) : (r.reps > 0 ? (3 as ReviewRating) : (3 as ReviewRating)),
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
```

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add app/actions/fsrs.ts
git commit -m "feat(actions): add getWeightsAction and optimizeWeightsAction"
```

---

### Task 5: Modify `submitFlashcardReviewAction` to use per-user weights

**Files:**
- Modify: `app/actions/fsrs.ts:109-156` (`submitFlashcardReviewAction`)

- [ ] **Step 1: Replace `submitFlashcardReviewAction`**

Replace the entire function in `app/actions/fsrs.ts`:

```ts
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
```

- [ ] **Step 2: Add optimization trigger to `ensureFlashcardsEnrolledAction`**

Replace `ensureFlashcardsEnrolledAction` in `app/actions/fsrs.ts`:

```ts
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
```

- [ ] **Step 3: Run tests**

Run: `npm test -- __tests__/ai/fsrs.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add app/actions/fsrs.ts
git commit -m "feat(fsrs): use per-user weights in submitFlashcardReviewAction"
```

---

### Task 6: Write adaptive FSRS integration tests

**Files:**
- Create: `__tests__/ai/adaptive-fsrs.test.ts`

- [ ] **Step 1: Create test file**

```ts
import { describe, it, expect } from 'vitest';
import {
  optimizeWeights,
  DEFAULT_WEIGHTS,
  scheduleCard,
  createEmptyCardState,
  nextDifficulty,
  nextRecallStability,
  forgettingCurve,
  type ReviewRecord,
} from '@/server/ai/fsrs';

function makeReview(overrides: Partial<ReviewRecord> = {}): ReviewRecord {
  return {
    rating: 3,
    state: 2,
    stability: 5,
    difficulty: 5,
    elapsedDays: 5,
    ...overrides,
  };
}

describe('Adaptive difficulty - optimizeWeights', () => {
  it('returns DEFAULT_WEIGHTS when reviews < 5', () => {
    const reviews = [makeReview(), makeReview(), makeReview()];
    const result = optimizeWeights(reviews);
    expect(result).toEqual([...DEFAULT_WEIGHTS]);
  });

  it('returns a 25-element array', () => {
    const reviews = Array.from({ length: 10 }, () => makeReview());
    const result = optimizeWeights(reviews);
    expect(result).toHaveLength(25);
  });

  it('all weights are finite numbers', () => {
    const reviews = Array.from({ length: 10 }, () => makeReview());
    const result = optimizeWeights(reviews);
    for (const w of result) {
      expect(Number.isFinite(w)).toBe(true);
    }
  });

  it('optimized weights produce different scheduling than defaults', () => {
    const reviews = Array.from({ length: 20 }, (_, i) =>
      makeReview({ rating: i % 2 === 0 ? 3 : 1, stability: 3 + (i % 5) })
    );
    const optimized = optimizeWeights(reviews);

    const card = {
      ...createEmptyCardState(),
      state: 2 as const,
      stability: 5,
      difficulty: 5,
      reps: 3,
      scheduledDays: 5,
      elapsedDays: 5,
    };

    const defaultNext = scheduleCard(card, 3, card, DEFAULT_WEIGHTS);
    const optimizedNext = scheduleCard(card, 3, card, optimized);

    expect(defaultNext.stability).not.toBe(optimizedNext.stability);
  });
});

describe('Adaptive difficulty - weights parameter', () => {
  it('nextDifficulty accepts custom weights', () => {
    const custom = [...DEFAULT_WEIGHTS];
    custom[6] = 2.0;
    const result = nextDifficulty(5, 3, custom);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(1);
    expect(result).toBeLessThanOrEqual(10);
  });

  it('nextRecallStability accepts custom weights', () => {
    const custom = [...DEFAULT_WEIGHTS];
    custom[8] = 2.0;
    const result = nextRecallStability(5, 5, 0.9, custom);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('scheduleCard with custom weights produces valid state', () => {
    const custom = [...DEFAULT_WEIGHTS];
    custom[0] = 0.5;
    const card = {
      ...createEmptyCardState(),
      state: 2 as const,
      stability: 5,
      difficulty: 5,
      reps: 3,
      scheduledDays: 5,
      elapsedDays: 5,
    };
    const result = scheduleCard(card, 3, card, custom);
    expect(result.state).toBe(2);
    expect(result.reps).toBe(4);
    expect(result.stability).toBeGreaterThan(0);
  });
});

describe('Adaptive difficulty - forgetting curve', () => {
  it('higher stability produces higher retention', () => {
    const low = forgettingCurve(5, 2);
    const high = forgettingCurve(5, 10);
    expect(high).toBeGreaterThan(low);
  });

  it('longer elapsed days produce lower retention', () => {
    const short = forgettingCurve(1, 5);
    const long = forgettingCurve(10, 5);
    expect(long).toBeLessThan(short);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm test -- __tests__/ai/adaptive-fsrs.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 3: Commit**

```bash
git add __tests__/ai/adaptive-fsrs.test.ts
git commit -m "test(fsrs): add adaptive difficulty integration tests"
```

---

### Task 7: Run full verification

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: All tests PASS (existing + new adaptive tests)

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: adaptive difficulty review fixes"
```
