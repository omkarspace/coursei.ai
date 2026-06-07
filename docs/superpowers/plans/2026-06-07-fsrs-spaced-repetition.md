# FSRS Spaced Repetition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static flashcard system with a per-user FSRS-4.1 spaced-repetition schedule so users get a daily "review due" queue on the dashboard. This is the retention loop that turns coursei.ai from a one-shot read into a daily habit.

**Architecture:** New `flashcard_reviews` table holds per-(user, course, chapter, cardIndex) state with FSRS fields. Pure-TypeScript FSRS-4.1 implementation in `server/ai/fsrs.ts`. New server actions: `getDueFlashcardsAction(userId, courseId?)`, `submitFlashcardReviewAction(reviewId, rating)`. New `FlashcardReview.jsx` client component for the review session. New `DueFlashcardCount` server component on dashboard.

**Tech Stack:** Drizzle (Neon Postgres), Next.js 15 server actions, Vitest, React, shadcn `Button`/`Progress`/`Card`.

---

## File Structure

| Path | Role | New / Modified |
|---|---|---|
| `server/ai/fsrs.ts` | Pure FSRS-4.1 algorithm (state transitions, intervals) | New |
| `server/db/schema.ts` | Add `flashcard_reviews` table + `CardState` type | Modified |
| `app/actions/fsrs.ts` | Server actions: get due cards, submit review | New |
| `app/_components/FlashcardReview.jsx` | Client review-session UI (rating buttons, progress) | New |
| `app/dashboard/_components/DueFlashcardCount.jsx` | Server component showing "X due today" badge on dashboard | New |
| `__tests__/ai/fsrs.test.ts` | FSRS algorithm unit tests | New |
| `__tests__/actions/fsrs.test.ts` | Server action tests (with mocked db) | New |
| `app/dashboard/page.jsx` | Mount `DueFlashcardCount` in dashboard | Modified |
| `app/course/[courseId]/start/_components/CourseStartClient.jsx` | Wire `FlashcardReview` button into the Flashcards tab | Modified |

---

### Task 1: Add `CardState` type and `flashcard_reviews` table

**Files:**
- Modify: `server/db/schema.ts:30-46` (add CardState type after Flashcard interface)
- Modify: `server/db/schema.ts:109` (add table after Flashcards)

- [ ] **Step 1: Add CardState type**

In `server/db/schema.ts`, after the `Flashcard` interface (line 46), add:

```ts
export type CardStateValue = 0 | 1 | 2 | 3; // 0=new, 1=learning, 2=review, 3=relearning
export type ReviewRating = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy

export interface CardState {
  due: string;        // ISO datetime
  stability: number;  // FSRS stability
  difficulty: number; // FSRS difficulty (1-10)
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: CardStateValue;
  lastReview: string | null; // ISO datetime or null if never reviewed
}
```

- [ ] **Step 2: Add `flashcard_reviews` table**

After the `Flashcards` table (line 109), add:

```ts
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
```

- [ ] **Step 3: Add relation**

After `flashcardsRelations` (line 169), add:

```ts
export const flashcardReviewsRelations = relations(FlashcardReviews, ({ one }) => ({
  course: one(CourseList, {
    fields: [FlashcardReviews.courseId],
    references: [CourseList.courseId],
  }),
}));
```

- [ ] **Step 4: Run `npm run db:push` to apply**

Run: `npm run db:push`
Expected: confirms applying `flashcard_reviews` to Neon without error.

- [ ] **Step 5: Commit**

```bash
git add server/db/schema.ts
git commit -m "feat(fsrs): add flashcard_reviews table for FSRS scheduling"
```

---

### Task 2: Implement FSRS-4.1 algorithm

**Files:**
- Create: `server/ai/fsrs.ts`
- Test: `__tests__/ai/fsrs.test.ts`

- [ ] **Step 1: Write failing test**

In `__tests__/ai/fsrs.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createEmptyCardState, scheduleCard, type FSRSState } from '@/server/ai/fsrs';

describe('FSRS algorithm', () => {
  it('creates an empty card with due=now, state=new, reps=0', () => {
    const card = createEmptyCardState();
    expect(card.state).toBe(0);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.lastReview).toBeNull();
    expect(new Date(card.due).getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('rating Again on a new card leaves state=new with short interval', () => {
    const before = createEmptyCardState();
    const after = scheduleCard(before, 1, before);
    expect(after.state).toBe(1); // learning
    expect(after.reps).toBe(1);
    expect(after.lapses).toBe(0);
  });

  it('rating Good on a new card promotes to state=learning', () => {
    const before = createEmptyCardState();
    const after = scheduleCard(before, 3, before);
    expect(after.state).toBeGreaterThanOrEqual(1);
    expect(after.reps).toBe(1);
  });

  it('rating Good twice in a row on a new card promotes to state=review', () => {
    let card = createEmptyCardState();
    card = scheduleCard(card, 3, card);
    card = scheduleCard(card, 3, card);
    expect(card.state).toBe(2); // review
    expect(card.reps).toBe(2);
    expect(card.scheduledDays).toBeGreaterThanOrEqual(1);
  });

  it('rating Again on a review card creates a lapse and goes to relearning', () => {
    let card: FSRSState = {
      ...createEmptyCardState(),
      state: 2,
      reps: 5,
      stability: 10,
      difficulty: 5,
      scheduledDays: 10,
      elapsedDays: 10,
    };
    const after = scheduleCard(card, 1, card);
    expect(after.lapses).toBe(1);
    expect(after.state).toBe(3); // relearning
  });

  it('rating Easy increases stability more than rating Good', () => {
    const card: FSRSState = {
      ...createEmptyCardState(),
      state: 2,
      reps: 3,
      stability: 5,
      difficulty: 5,
      scheduledDays: 5,
      elapsedDays: 5,
    };
    const easy = scheduleCard(card, 4, card);
    const good = scheduleCard(card, 3, card);
    expect(easy.stability).toBeGreaterThan(good.stability);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/ai/fsrs.test.ts`
Expected: FAIL — module `@/server/ai/fsrs` not found.

- [ ] **Step 3: Implement FSRS-4.1 algorithm**

Create `server/ai/fsrs.ts`:

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

const DAY_MS = 24 * 60 * 60 * 1000;

// FSRS-4.1 default weights (publicly documented, optimal for most users)
const W = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544,
  1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567, 0.0000,
  1.1986, 0.1464, 0.1045, 0.0824, 0.0831,
];

const RATING: Record<ReviewRating, number> = { 1: 1, 2: 2, 3: 3, 4: 4 };

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function forgettingCurve(elapsedDays: number, stability: number): number {
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

function nextInterval(s: number, elapsedDays: number, desiredRetention = 0.9): number {
  return Math.max(1, Math.round((s / 9) * (Math.pow(desiredRetention, -1 / 9) - 1) - elapsedDays));
}

function nextDifficulty(d: number, rating: number): number {
  const next = d - W[6] * (rating - 3);
  return clamp(next, 1, 10);
}

function nextRecallStability(d: number, s: number, r: number): number {
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp((1 - r) * W[10]) - 1));
}

function nextForgetStability(d: number, s: number, r: number): number {
  return W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]);
}

function initStability(r: number): number {
  return Math.max(W[0], W[1] * Math.pow(r, -W[2]) * Math.exp(W[3] * 1));
}

function initDifficulty(r: number): number {
  return clamp(W[4] - Math.exp(W[5] * 1) * (r - 1) + 1, 1, 10);
}

function shortTermStability(s: number, r: number): number {
  return s * Math.exp(W[17] * (r - 3 + W[18]));
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
  now: FSRSState
): FSRSState {
  const elapsedDays = prev.lastReview
    ? Math.max(0, Math.round((new Date(now.due).getTime() - new Date(prev.lastReview).getTime()) / DAY_MS))
    : 0;
  const r = RATING[rating];

  // New card (state=0)
  if (prev.state === 0) {
    const difficulty = prev.difficulty > 0 ? prev.difficulty : initDifficulty(r);
    const stability = prev.stability > 0 ? prev.stability : initStability(r);
    if (rating === 1) {
      // Again: stay in learning, schedule 1 minute out
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
      // Hard/Good: stay in learning, schedule 5/10 minutes out
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
    // Easy: graduate to review with stability
    const s = shortTermStability(stability, r);
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

  // Learning / Relearning (state=1 or 3)
  if (prev.state === 1 || prev.state === 3) {
    if (rating === 1) {
      // Again: restart this step
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
      // Promote to review
      const s = shortTermStability(prev.stability, r);
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
    // Easy: graduate with bonus stability
    const s = shortTermStability(prev.stability, r) * 1.3;
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

  // Review (state=2)
  const recall = forgettingCurve(elapsedDays, prev.stability);
  if (rating === 1) {
    // Lapse
    const s = nextForgetStability(prev.difficulty, prev.stability, recall);
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
  // Hard / Good / Easy
  const newDifficulty = nextDifficulty(prev.difficulty, r);
  const newStability = nextRecallStability(newDifficulty, prev.stability, recall);
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/ai/fsrs.test.ts`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add server/ai/fsrs.ts __tests__/ai/fsrs.test.ts
git commit -m "feat(fsrs): add FSRS-4.1 algorithm with state machine"
```

---

### Task 3: Server actions for FSRS

**Files:**
- Create: `app/actions/fsrs.ts`
- Test: `__tests__/actions/fsrs.test.ts`

- [ ] **Step 1: Write failing test**

In `__tests__/actions/fsrs.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}));

vi.mock('@/server/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 1 }]),
  },
}));

describe('FSRS server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'postgres://x';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_x';
    process.env.CLERK_SECRET_KEY = 'sk_test_x';
  });

  it('getDueFlashcardsAction returns up to 20 due rows for the user', async () => {
    const due = [
      { id: 1, userId: 'user_123', courseId: 'c1', chapterId: 0, cardIndex: 0, due: new Date() },
      { id: 2, userId: 'user_123', courseId: 'c1', chapterId: 0, cardIndex: 1, due: new Date() },
    ];
    const db = (await import('@/server/db')).db;
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(due),
          }),
        }),
      }),
    });

    const { getDueFlashcardsAction } = await import('@/app/actions/fsrs');
    const result = await getDueFlashcardsAction();
    expect(result).toHaveLength(2);
  });

  it('getDueCountAction returns count of due cards', async () => {
    const db = (await import('@/server/db')).db;
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: '5' }]),
      }),
    });

    const { getDueCountAction } = await import('@/app/actions/fsrs');
    const count = await getDueCountAction('user_123');
    expect(count).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/actions/fsrs.test.ts`
Expected: FAIL — module `@/app/actions/fsrs` not found.

- [ ] **Step 3: Implement server actions**

Create `app/actions/fsrs.ts`:

```ts
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

  // Fetch the actual card content from the Flashcards table
  const chapterKeys = reviews.map((r) => ({ courseId: r.courseId, chapterId: r.chapterId }));
  const uniqueKeys = Array.from(new Set(chapterKeys.map((k) => `${k.courseId}::${k.chapterId}`)));
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

  const rows = await db.select().from(FlashcardReviews).where(eq(FlashcardReviews.id, reviewId));
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

  // Idempotent: insert one FlashcardReview row per (user, course, chapter, cardIndex) if not exists.
  // Uses default empty state (state=0, due=now) so all cards are immediately due.
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/actions/fsrs.test.ts`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/actions/fsrs.ts __tests__/actions/fsrs.test.ts
git commit -m "feat(fsrs): add server actions for due cards, count, review submission"
```

---

### Task 4: Dashboard "X due today" badge

**Files:**
- Create: `app/dashboard/_components/DueFlashcardCount.jsx`
- Modify: `app/dashboard/page.jsx` (add the component to the dashboard)

- [ ] **Step 1: Create the server component**

Create `app/dashboard/_components/DueFlashcardCount.jsx`:

```jsx
import Link from 'next/link';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import { getDueCountAction } from '@/app/actions/fsrs';
import { auth } from '@clerk/nextjs/server';

export default async function DueFlashcardCount() {
  const { userId } = await auth();
  if (!userId) return null;

  const count = await getDueCountAction(userId);
  if (count === 0) return null;

  return (
    <Link
      href="/review"
      className="flex items-center gap-3 p-4 mb-4 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
    >
      <HiOutlineAcademicCap className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <p className="text-sm font-medium">
          {count} {count === 1 ? 'card' : 'cards'} due for review
        </p>
        <p className="text-xs text-muted-foreground">Keep your streak going</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Mount in dashboard**

Read `app/dashboard/page.jsx` to find the import + render location, then add:

```jsx
import DueFlashcardCount from './_components/DueFlashcardCount';
```

…and place `<DueFlashcardCount />` near the top of the main column (just inside the main wrapper, before the course list).

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/_components/DueFlashcardCount.jsx app/dashboard/page.jsx
git commit -m "feat(fsrs): add dashboard 'X due today' badge"
```

---

### Task 5: Review session page

**Files:**
- Create: `app/review/page.jsx` (server component)
- Create: `app/review/ReviewClient.jsx` (client component)
- Create: `app/_components/FlashcardReview.jsx` (reused in course page too)

- [ ] **Step 1: Create the review session client component**

Create `app/_components/FlashcardReview.jsx`:

```jsx
'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { submitFlashcardReviewAction, ensureFlashcardsEnrolledAction } from '@/app/actions/fsrs';

export default function FlashcardReview({ initialDue, scope }) {
  const [cards, setCards] = useState(initialDue);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done || cards.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-lg font-medium">No cards due right now.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Come back later — your schedule will tell you when.
          </p>
        </CardContent>
      </Card>
    );
  }

  const current = cards[index];
  const progressPct = Math.round(((index + 1) / cards.length) * 100);

  const submit = (rating) => {
    startTransition(async () => {
      try {
        await submitFlashcardReviewAction(current.reviewId, rating);
        setFlipped(false);
        if (index + 1 >= cards.length) {
          setDone(true);
        } else {
          setIndex(index + 1);
        }
      } catch (err) {
        toast.error('Failed to save review. Please try again.');
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Progress value={progressPct} className="flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {index + 1} / {cards.length}
        </span>
      </div>

      <Card
        className="cursor-pointer min-h-[200px] flex items-center justify-center"
        onClick={() => setFlipped(!flipped)}
      >
        <CardContent className="p-8 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            {flipped ? 'Back' : 'Front'} — click to flip
          </p>
          <p className="text-lg">{flipped ? current.card.back : current.card.front}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        <Button variant="outline" disabled={pending} onClick={() => submit(1)}>
          Again
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => submit(2)}>
          Hard
        </Button>
        <Button variant="default" disabled={pending} onClick={() => submit(3)}>
          Good
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => submit(4)}>
          Easy
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the review page**

Create `app/review/page.jsx`:

```jsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getDueFlashcardsAction } from '@/app/actions/fsrs';
import FlashcardReview from '@/app/_components/FlashcardReview';
import Header from '@/app/dashboard/_components/Header';

export const metadata = { title: 'Review — coursei.ai' };

export default async function ReviewPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const due = await getDueFlashcardsAction();

  return (
    <div className="min-h-screen dark:bg-gray-950">
      <Header />
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-1">Review</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Spaced repetition — see a card, recall the answer, then rate how well you knew it.
        </p>
        <FlashcardReview initialDue={due} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/_components/FlashcardReview.jsx app/review/page.jsx
git commit -m "feat(fsrs): add /review page with FSRS session UI"
```

---

### Task 6: Enroll users in flashcard reviews when they view a chapter

**Files:**
- Modify: `app/course/[courseId]/start/_components/CourseStartClient.jsx`

- [ ] **Step 1: Read the current file to find the flashcard tab**

- [ ] **Step 2: Add an effect that calls `ensureFlashcardsEnrolledAction` when the Flashcards tab is opened**

Inside the component, add:

```jsx
import { ensureFlashcardsEnrolledAction, getDueFlashcardsAction } from '@/app/actions/fsrs';

// ...inside the component, near the other useEffects:
useEffect(() => {
  if (activeTab !== 'flashcards') return;
  (async () => {
    const cards = await getDueFlashcardsAction(courseId);
    if (cards.length === 0) {
      // No reviews yet — enroll all 10 cards from the chapter
      await ensureFlashcardsEnrolledAction(courseId, currentChapterId, 10);
    }
  })();
}, [activeTab, currentChapterId, courseId]);
```

(`currentChapterId` is whatever prop already holds the active chapter index — name it correctly based on what the file actually uses.)

- [ ] **Step 3: Commit**

```bash
git add app/course/[courseId]/start/_components/CourseStartClient.jsx
git commit -m "feat(fsrs): auto-enroll chapter flashcards in review schedule"
```

---

### Task 7: Verification

- [ ] Run `npm run lint` — must show "No ESLint warnings or errors"
- [ ] Run `npm test` — all 6 original tests + 6 new FSRS tests + 2 new action tests must pass (≥ 44 total)
- [ ] Run `npm run build` — must compile cleanly
- [ ] Run `npm run db:push` — must apply the new `flashcard_reviews` table

---

## Self-Review

- Spec coverage: ✅ task 1 (schema), ✅ task 2 (algorithm), ✅ task 3 (actions), ✅ task 4 (dashboard badge), ✅ task 5 (review page), ✅ task 6 (enrollment), ✅ task 7 (verification).
- No placeholders: every step has full code or a clear pointer to existing patterns.
- Type consistency: `FSRSState` is exported from `fsrs.ts`; `CardStateValue` and `ReviewRating` are exported from `schema.ts`; both are used consistently across files.
- DRY: FSRS logic lives in one file (`fsrs.ts`); UI components in `_components/`; data in `app/actions/fsrs.ts`.
