# Performance & Search Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve UI responsiveness via optimistic updates and enhance semantic search quality by enriching vector embeddings with chapter-level content.

**Architecture:** Two independent improvements: (1) Move `setCompletedChapters` before the `await` in `handleMarkComplete` for instant UI feedback, with rollback on failure. (2) Enhance the `upsertCourseVector` call in `publishCourse` to include chapter names/descriptions, and add a dedicated Inngest function for re-indexing when chapters change.

**Tech Stack:** React state, Drizzle ORM, Upstash Vector, Inngest, Next.js Server Actions

---

## File Map

| File                                                            | Action | Responsibility                                         |
| --------------------------------------------------------------- | ------ | ------------------------------------------------------ |
| `app/course/[courseId]/start/_components/CourseStartClient.jsx` | Modify | Optimistic UI for chapter completion                   |
| `app/actions/course.ts`                                         | Modify | Enhanced `publishCourse` with chapter-enriched vectors |
| `server/services/vector.ts`                                     | Modify | Add `upsertCourseVectorFull` with chapter data         |
| `server/services/inngest.ts`                                    | Modify | Add `reindexCourseVectors` Inngest function            |
| `app/api/inngest/route.ts`                                      | Modify | Register new Inngest function                          |
| `server/db/schema.ts`                                           | Modify | Add `vectorIndexedAt` column to CourseList             |
| `drizzle/0001_add_vector_indexed_at.sql`                        | Create | Migration for new column                               |

---

### Task 1: Optimistic UI for Chapter Completion

**Files:**

- Modify: `app/course/[courseId]/start/_components/CourseStartClient.jsx:69-84`

- [ ] **Step 1: Update `handleMarkComplete` to apply optimistic state before await**

Replace the current `handleMarkComplete` function (lines 69-84) with:

```javascript
const handleMarkComplete = async () => {
  const chapterIndex = course?.courseOutput?.course?.chapters.indexOf(selectedChapter);
  if (chapterIndex === undefined) return;

  // Optimistic update: immediately reflect completion in UI
  const previousChapters = [...completedChapters];
  if (!completedChapters.includes(chapterIndex)) {
    setCompletedChapters((prev) => [...prev, chapterIndex]);
  }
  setMarkingComplete(true);

  try {
    await markChapterComplete(course.courseId, chapterIndex);
  } catch (error) {
    // Rollback on failure
    setCompletedChapters(previousChapters);
    console.error('Failed to mark chapter as complete:', error);
  } finally {
    setMarkingComplete(false);
  }
};
```

- [ ] **Step 2: Verify the change compiles**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add app/course/[courseId]/start/_components/CourseStartClient.jsx
git commit -m "feat: optimistic UI update for chapter completion"
```

---

### Task 2: Add `vectorIndexedAt` Column to CourseList

**Files:**

- Create: `drizzle/0001_add_vector_indexed_at.sql`
- Modify: `server/db/schema.ts:64-83`

- [ ] **Step 1: Create the migration SQL file**

```sql
-- drizzle/0001_add_vector_indexed_at.sql
ALTER TABLE "CourseList" ADD COLUMN "vectorIndexedAt" timestamp;
```

- [ ] **Step 2: Add the column to the Drizzle schema**

In `server/db/schema.ts`, add `vectorIndexedAt` inside the `CourseList` table definition, after the `updatedAt` field (line 82):

```typescript
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  vectorIndexedAt: timestamp("vectorIndexedAt"),
});
```

- [ ] **Step 3: Run the migration**

Run: `npm run db:push`
Expected: Schema changes applied to Neon database

- [ ] **Step 4: Commit**

```bash
git add drizzle/0001_add_vector_indexed_at.sql server/db/schema.ts
git commit -m "feat: add vectorIndexedAt column to CourseList"
```

---

### Task 3: Enhanced Vector Embedding with Chapter Data

**Files:**

- Modify: `server/services/vector.ts:50-83`

- [ ] **Step 1: Add `upsertCourseVectorFull` function**

Append the following function to `server/services/vector.ts` after the existing `upsertCourseVector` function (after line 83):

```typescript
/**
 * Upsert a course into the vector index with enriched chapter data
 */
export async function upsertCourseVectorFull(
  courseId: string,
  name: string,
  description: string,
  category: string,
  level: string,
  chapters: { name: string; about: string }[]
): Promise<void> {
  if (!isVectorEnabled()) {
    console.log('Upstash Vector not configured, skipping indexing');
    return;
  }

  // Combine course metadata with chapter names and descriptions for richer embedding
  const chapterText = chapters.map((ch) => `${ch.name}: ${ch.about}`).join(' ');
  const text = `${name} ${description} ${category} ${level} ${chapterText}`;

  const vector = generateSimpleEmbedding(text);

  await vectorFetch('/upsert', {
    method: 'POST',
    body: JSON.stringify({
      id: `course:${courseId}`,
      vector,
      metadata: {
        courseId,
        name,
        description: description.slice(0, 500),
        category,
        level,
        chapters: chapters.map((ch) => ch.name).join(', '),
        type: 'course',
      },
    }),
  });
}
```

- [ ] **Step 2: Verify the file has no syntax errors**

Run: `npx tsc --noEmit server/services/vector.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add server/services/vector.ts
git commit -m "feat: add upsertCourseVectorFull with chapter-enriched embeddings"
```

---

### Task 4: Update `publishCourse` to Use Chapter-Enriched Vectors

**Files:**

- Modify: `app/actions/course.ts:182-228`

- [ ] **Step 1: Update the import in `app/actions/course.ts`**

Change line 15 from:

```typescript
import { upsertCourseVector, deleteCourseVector } from '@/server/services/vector';
```

to:

```typescript
import { upsertCourseVectorFull, deleteCourseVector } from '@/server/services/vector';
```

- [ ] **Step 2: Update the `publishCourse` function to fetch chapters and use enriched vector**

Replace lines 209-222 (the vector indexing block inside `publishCourse`) with:

```typescript
// Index in vector search with chapter-enriched embeddings
const courseOutput = course.courseOutput as any;
try {
  // Fetch chapters for richer embedding
  const chapters = await db
    .select({ name: CourseList.name })
    .from(Chapters)
    .where(eq(Chapters.courseId, courseId));

  const chapterData = (courseOutput.course.chapters || []).map((ch: any, i: number) => ({
    name: ch.name,
    about: ch.about || '',
  }));

  await upsertCourseVectorFull(
    courseId,
    courseOutput.course.name,
    courseOutput.course.description,
    course.category,
    course.level,
    chapterData
  );

  // Record when vector was last indexed
  await db
    .update(CourseList)
    .set({ vectorIndexedAt: new Date() })
    .where(eq(CourseList.courseId, courseId));
} catch (error) {
  console.error('Failed to index course in vector search:', error);
}
```

- [ ] **Step 3: Add the missing `Chapters` import**

Check that line 9 already imports `Chapters`:

```typescript
import {
  CourseList,
  Chapters,
  Quizzes,
  Flashcards,
  StudyNotesTable,
  UserProgress,
} from '@/server/db/schema';
```

- [ ] **Step 4: Verify the build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add app/actions/course.ts
git commit -m "feat: publishCourse now indexes chapter-enriched vector embeddings"
```

---

### Task 5: Inngest Function for Re-indexing Vectors on Chapter Update

**Files:**

- Modify: `server/services/inngest.ts`
- Modify: `app/api/inngest/route.ts`
- Create: `server/ai/reindex-vectors.ts`

- [ ] **Step 1: Create the Inngest function for vector re-indexing**

Create `server/ai/reindex-vectors.ts`:

```typescript
import { inngest } from '@/server/services/inngest';
import { db } from '@/server/db';
import { CourseList, Chapters } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { upsertCourseVectorFull } from '@/server/services/vector';

export const reindexCourseVectors = inngest.createFunction(
  {
    id: 'reindex-course-vectors',
    triggers: [{ event: 'course.reindex_vectors' }],
  },
  async ({ event, step }) => {
    const { courseId } = event.data as { courseId: string };

    // Step 1: Fetch course data
    const course = await step.run('fetch-course', async () => {
      const result = await db.select().from(CourseList).where(eq(CourseList.courseId, courseId));
      return result[0] || null;
    });

    if (!course || !course.publish) {
      return { courseId, skipped: true, reason: 'Course not found or not published' };
    }

    // Step 2: Fetch chapters
    const chapters = await step.run('fetch-chapters', async () => {
      const result = await db.select().from(Chapters).where(eq(Chapters.courseId, courseId));
      return result;
    });

    // Step 3: Re-index vector with enriched data
    await step.run('upsert-vector', async () => {
      const courseOutput = course.courseOutput as any;
      const chapterData = (courseOutput.course.chapters || []).map((ch: any) => ({
        name: ch.name,
        about: ch.about || '',
      }));

      await upsertCourseVectorFull(
        courseId,
        courseOutput.course.name,
        courseOutput.course.description,
        course.category,
        course.level,
        chapterData
      );

      await db
        .update(CourseList)
        .set({ vectorIndexedAt: new Date() })
        .where(eq(CourseList.courseId, courseId));
    });

    return { courseId, status: 'reindexed' };
  }
);
```

- [ ] **Step 2: Register the function in the Inngest route**

Update `app/api/inngest/route.ts` from:

```typescript
import { serve } from 'inngest/next';
import { inngest } from '@/server/services/inngest';
import { generateCourse } from '@/server/ai/generate-course';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateCourse],
});
```

to:

```typescript
import { serve } from 'inngest/next';
import { inngest } from '@/server/services/inngest';
import { generateCourse } from '@/server/ai/generate-course';
import { reindexCourseVectors } from '@/server/ai/reindex-vectors';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateCourse, reindexCourseVectors],
});
```

- [ ] **Step 3: Trigger re-index after course generation completes**

In `server/ai/generate-course.ts`, add at the top:

```typescript
import { upsertCourseVectorFull } from '@/server/services/vector';
```

Replace the final step (lines 96-105) to also index the vector when generation completes:

```typescript
// Step 3: Mark as complete and index in vector search
await step.run('update-status-complete', async () => {
  await db
    .update(CourseList)
    .set({
      status: 'complete',
      progress: 100,
      currentStep: 'Complete',
    })
    .where(eq(CourseList.courseId, courseId));

  // Auto-index in vector search if course will be published later
  // (Index on publish instead - see Task 4)
});

return { courseId, status: 'complete' };
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add server/ai/reindex-vectors.ts app/api/inngest/route.ts server/ai/generate-course.ts
git commit -m "feat: add Inngest function for re-indexing course vectors"
```

---

### Task 6: Trigger Vector Re-index When Course Details Change

**Files:**

- Modify: `app/actions/course.ts:250-284` (updateCourseNameAndDescription)

- [ ] **Step 1: Add Inngest import to `app/actions/course.ts`**

Add at the top of the file, after the existing imports:

```typescript
import { inngest } from '@/server/services/inngest';
```

- [ ] **Step 2: Fire re-index event after course name/description update**

At the end of the `updateCourseNameAndDescription` function (before the closing brace, after line 283), add:

```typescript
// Re-index vector search if course is published
const updatedCourse = await db
  .select({ publish: CourseList.publish })
  .from(CourseList)
  .where(eq(CourseList.courseId, courseId));

if (updatedCourse[0]?.publish) {
  await inngest.send('course.reindex_vectors', {
    data: { courseId },
  });
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add app/actions/course.ts
git commit -m "feat: trigger vector re-index when published course details change"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors (warnings acceptable)

- [ ] **Step 3: Verify database migration applied**

Run: `npm run db:push`
Expected: "No schema changes" or successful push

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: final verification fixes"
```
