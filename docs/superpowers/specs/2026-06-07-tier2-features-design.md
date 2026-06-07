# Tier-2 Features Design Spec — Adaptive Difficulty, Quiz FSRS, Learning Paths

## Overview

Three independent Tier-2 features to deepen learning engagement:

1. **Adaptive Difficulty** — Per-user FSRS weight optimization
2. **Quiz FSRS** — Full spaced repetition for quiz questions
3. **Learning Paths** — Drag-and-drop chapter reordering + prerequisite-aware recommendations

No cross-feature dependencies. Each can be built and shipped independently.

---

## Feature 1: Adaptive Difficulty

### Goal

Replace hardcoded FSRS-4.1 weights with per-user optimized weights that adapt to each learner's recall patterns.

### Schema

**New table: `user_fsrs_weights`**

```sql
CREATE TABLE user_fsrs_weights (
  id serial PRIMARY KEY,
  userId varchar NOT NULL,
  courseId varchar NOT NULL,
  weights float[] NOT NULL DEFAULT '{0.4072,1.1829,3.1262,15.4722,7.2102,0.5316,1.0651,0.0234,1.616,0.1544,1.0824,1.9813,0.0953,0.2975,2.2042,0.2407,2.9466,0.5034,0.6567,0.0,1.1986,0.1464,0.1045,0.0824,0.0831}',
  optimizedAt timestamp,
  reviewCount integer NOT NULL DEFAULT 0,
  CONSTRAINT unique_user_course UNIQUE (userId, courseId)
);
```

### Algorithm Changes

**`server/ai/fsrs.ts` modifications:**

1. All FSRS functions (`nextInterval`, `nextStability`, `nextDifficulty`, `nextRecallStability`, `nextForgetStability`, `nextLapseStability`, `shortTermStability`) accept a `weights: number[]` parameter instead of using the module-level `W` constant.

2. **New: `getUserWeights(userId, courseId)`** — queries `user_fsrs_weights` table. Returns per-user weights if row exists, otherwise returns the default `W` array and creates a new row.

3. **New: `optimizeWeights(reviews[])`** — FSRS parameter optimizer:
   - Input: array of `{ rating, stability, difficulty, elapsedDays, state }` from review history
   - Grid search over 25 weights (binary search for each weight, converge when RMSE delta < 0.001)
   - Output: optimized `float[25]`
   - Target: minimize RMSE between predicted retention and actual recall outcomes
   - Complexity: ~100ms for 50 reviews, ~200ms for 200 reviews

4. **Modified: `nextDifficulty(d, rating, weights?)`** — uses provided weights, falls back to `W` if not provided

### Files

| Action | File |
|--------|------|
| Modify | `server/ai/fsrs.ts` — add weights parameter to all functions, add `getUserWeights`, `optimizeWeights` |
| Create | `server/db/schema.ts` — add `UserFSRSWeights` table + TS interface |
| Modify | `app/actions/fsrs.ts` — add `getWeightsAction`, `optimizeWeightsAction`, modify `submitFlashcardReviewAction` |
| Create | `app/actions/optimize-weights.ts` — weight optimization action (called after review batches) |

### Data Flow

```
User reviews flashcard
  → submitFlashcardReviewAction()
    → getUserWeights(userId, courseId) — get or create weights
    → nextDifficulty(d, rating, weights) — use personalized weights
    → update FlashcardReviews row
    → increment reviewCount on UserFSRSWeights
    → if reviewCount % 20 == 0:
        → fetch all reviews for this user+course
        → optimizeWeights(reviews) → new weights
        → save to UserFSRSWeights
```

### Thresholds

- **Minimum reviews for optimization:** 10 (before that, use defaults)
- **Optimization frequency:** Every 20 reviews
- **Fallback:** If optimization fails (e.g., insufficient data), keep current weights

### UI

No new components. Existing review session uses optimized weights automatically.

Optional: `PersonalizedBadge` component — shows "🎯 Personalized" after optimization activates.

---

## Feature 2: Quiz FSRS

### Goal

Add full spaced repetition to quiz questions with per-user tracking, attempt history, and review scheduling.

### Schema

**New table: `quiz_attempts`**

```sql
CREATE TABLE quiz_attempts (
  id serial PRIMARY KEY,
  userId varchar NOT NULL,
  courseId varchar NOT NULL,
  chapterId integer NOT NULL,
  score integer NOT NULL,
  totalQuestions integer NOT NULL,
  answers json NOT NULL,  -- QuizAnswer[]
  createdAt timestamp DEFAULT NOW()
);
```

**New table: `quiz_reviews`**

```sql
CREATE TABLE quiz_reviews (
  id serial PRIMARY KEY,
  userId varchar NOT NULL,
  courseId varchar NOT NULL,
  chapterId integer NOT NULL,
  questionIndex integer NOT NULL,
  state smallint NOT NULL DEFAULT 0,
  stability float NOT NULL DEFAULT 0,
  difficulty float NOT NULL DEFAULT 0,
  due timestamp NOT NULL DEFAULT NOW(),
  reps integer NOT NULL DEFAULT 0,
  lapses integer NOT NULL DEFAULT 0,
  lastReview timestamp,
  CONSTRAINT unique_quiz_review UNIQUE (userId, courseId, chapterId, questionIndex)
);
```

**TypeScript interfaces:**

```ts
interface QuizAnswer {
  questionIndex: number;
  selectedAnswer: number;
  isCorrect: boolean;
}

interface QuizReview {
  id: number;
  userId: string;
  courseId: string;
  chapterId: number;
  questionIndex: number;
  state: CardStateValue;
  stability: number;
  difficulty: number;
  due: Date;
  reps: number;
  lapses: number;
  lastReview: Date | null;
}
```

### How It Works

1. User completes a quiz → `saveQuizAttemptAction` persists attempt to `quiz_attempts`
2. Each question gets a `quiz_reviews` row (upsert by unique constraint)
3. State machine identical to flashcards: 0=New, 1=Learning, 2=Review, 3=Relearning
4. Initial quiz always uses state 0 (New) for all questions — no prior history
5. After initial quiz, FSRS schedules when each question is due for review
6. "Quiz Review" session shows only due questions (same pattern as flashcard review)
7. Uses per-user weights from `user_fsrs_weights` table (shared with flashcards)

### Files

| Action | File |
|--------|------|
| Create | `server/db/schema.ts` — add `QuizAttempts`, `QuizReviews` tables + TS interfaces |
| Modify | `app/actions/fsrs.ts` — add quiz review actions |
| Modify | `app/actions/ai.ts` — modify `generateQuizAction` to save attempt |
| Modify | `app/course/[courseId]/start/_components/CourseStartClient.jsx` — add Quiz Review tab |
| Create | `app/course/[courseId]/start/_components/QuizReview.jsx` — quiz review session UI |
| Create | `app/course/[courseId]/start/_components/QuizHistory.jsx` — attempt history display |
| Create | `app/_components/DueQuizCount.jsx` — dashboard badge for due quiz questions |

### Actions

```ts
// Save quiz attempt + create FSRS records for each question
saveQuizAttemptAction(userId, courseId, chapterId, answers: QuizAnswer[])

// Get due quiz questions for review
getDueQuizQuestionsAction(userId, courseId, chapterId): QuizQuestion[]

// Submit a quiz review (rate Again/Hard/Good/Easy)
submitQuizReviewAction(userId, courseId, chapterId, questionIndex, rating)

// Get quiz attempt history
getQuizAttemptHistoryAction(userId, courseId, chapterId): QuizAttempt[]

// Get due quiz count for dashboard badge
getDueQuizCountAction(userId, courseId): number
```

### UI

**Quiz Review tab** (alongside Flashcards, Chat in course viewer):
- Shows questions one-by-one, user self-rates (Again/Hard/Good/Easy) like flashcards
- Displays: question text, 4 options, correct answer highlighted after rating
- Shows due count: "3 questions due for review"

**Quiz attempt history** (chapter view):
- Shows past attempts with scores and dates
- Chart: score over time (optional, lightweight)

**Dashboard badge:**
- `DueQuizCount` — "X quiz questions due" (similar to `DueFlashcardCount`)

### Migration Strategy

- Existing quizzes get `quiz_reviews` rows on first quiz review session
- Initial state: all questions start as New (state 0)
- Users who never review quizzes are unaffected

---

## Feature 3: Learning Paths

### Goal

Allow chapter reordering via drag-and-drop, persist AI-generated metadata (difficulty, prerequisites, learning objectives), and recommend next chapters based on prerequisites and progress.

### Schema Changes

**`chapters` table:**

```sql
ALTER TABLE chapters ADD COLUMN orderIndex integer NOT NULL DEFAULT 0;
ALTER TABLE chapters ADD CONSTRAINT unique_course_order UNIQUE (courseId, orderIndex);
```

**`courseOutput` JSON — preserve AI metadata:**

```ts
interface CourseChapter {
  name: string;
  about: string;
  duration: string;
  difficulty?: string;           // NEW: persisted (was stripped)
  learningObjectives?: string[]; // NEW: persisted (was stripped)
  prerequisites?: string[];      // NEW: persisted (was stripped)
}
```

### Files

| Action | File |
|--------|------|
| Modify | `server/db/schema.ts` — add `orderIndex` to Chapters table |
| Modify | `app/actions/outline.ts` — preserve difficulty/prereqs/objectives in `saveOutlineAction` |
| Modify | `app/actions/course.ts` — add `reorderChaptersAction`, `getNextChapterAction` |
| Modify | `app/create-course/[courseId]/_components/OutlineEditor.jsx` — add `@dnd-kit/core` drag-and-drop |
| Modify | `app/course/[courseId]/start/page.jsx` — load chapters by `orderIndex` |
| Modify | `app/course/[courseId]/start/_components/CourseStartClient.jsx` — sidebar shows orderIndex order |
| Create | `app/dashboard/_components/ContinueLearning.jsx` — "Continue Learning" button |
| Modify | `app/actions/outline.ts` — `generateOutlineAction` preserves metadata in courseOutput |

### Outline Editor Changes

**Drag-and-drop with `@dnd-kit/core`:**

1. Install: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
2. Wrap chapter list in `<DndContext>` + `<SortableContext>`
3. Each chapter row gets a drag handle (lucide `GripVertical` icon)
4. On drag end, reorder the chapters array in state
5. On save, `saveOutlineAction` persists:
   - Reordered `courseOutput.course.chapters[]` array
   - `orderIndex` on each `Chapters` row

**Add chapter button:**
- "+" button at bottom of outline
- Appends empty chapter to end of array
- User can then edit name/about inline

### Continue Learning Logic

```ts
getNextChapterAction(courseId, userId): { chapterIndex: number; chapterName: string } | null
```

Algorithm:
1. Get all chapters ordered by `orderIndex`
2. Get completed chapters from `UserProgress` table
3. For each incomplete chapter (in orderIndex order):
   - Check if all `prerequisites` are completed
   - If yes → return this chapter
4. If no chapter found → return null (course complete)

### Persistence of Metadata

`generateOutlineAction` now passes through `difficulty`, `learningObjectives`, `prerequisites` from agent output to `courseOutput`:

```ts
// Before (stripped):
chapters.map(ch => ({ name: ch.name, about: ch.about, duration: ch.duration }))

// After (preserved):
chapters.map(ch => ({
  name: ch.name,
  about: ch.about,
  duration: ch.duration,
  difficulty: ch.difficulty,
  learningObjectives: ch.learningObjectives,
  prerequisites: ch.prerequisites,
}))
```

### UI

**Outline editor:**
- Drag handles on each chapter row
- Visual reorder feedback (opacity, shadow)
- "+" button to add chapters
- Duration follows the chapter (not the index) — fix latent bug

**Course viewer sidebar:**
- Chapters shown in `orderIndex` order
- Difficulty indicator: 🟢 Easy / 🟡 Medium / 🔴 Hard (from persisted metadata)

**Dashboard:**
- `ContinueLearning` component — shows last viewed course + next chapter
- Calls `getNextChapterAction` to determine what to show

### Migration Strategy

- Existing chapters get `orderIndex = chapterId` (preserve current order)
- Existing `courseOutput` gets metadata backfilled from chapter content (best-effort)

---

## Cross-Cutting Concerns

### Testing

Each feature gets its own test file:

| Feature | Test File |
|---------|-----------|
| Adaptive Difficulty | `__tests__/ai/adaptive-fsrs.test.ts` |
| Quiz FSRS | `__tests__/ai/quiz-fsrs.test.ts` |
| Learning Paths | `__tests__/actions/learning-paths.test.ts` |

**Adaptive FSRS tests:**
- `optimizeWeights` returns valid 25-element array
- Optimization converges (RMSE decreases)
- Falls back to defaults with < 10 reviews
- `getUserWeights` creates default row on first call

**Quiz FSRS tests:**
- `saveQuizAttemptAction` creates attempt + quiz_reviews rows
- `submitQuizReviewAction` updates FSRS state correctly
- `getDueQuizQuestionsAction` returns only due questions
- State transitions match flashcard FSRS

**Learning paths tests:**
- `reorderChaptersAction` updates orderIndex
- `getNextChapterAction` respects prerequisites
- `getNextChapterAction` returns null when course complete

### Database Migration

Run `npm run db:push` after schema changes. New tables: `user_fsrs_weights`, `quiz_attempts`, `quiz_reviews`. Modified table: `chapters` (+ `orderIndex`).

### AGENTS.md Updates

- Document new tables in "Database" section
- Document new actions in "Server Actions" section
- Update "Key Files" with new test files
- Add `@dnd-kit/core` to dependencies

---

## Implementation Order

1. **Feature 1: Adaptive Difficulty** — no UI changes, purely backend
2. **Feature 2: Quiz FSRS** — new tables + UI components
3. **Feature 3: Learning Paths** — schema change + drag-and-drop

Each feature is independently shippable. No feature blocks another.
