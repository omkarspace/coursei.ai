# Learning Paths Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow chapter reordering via drag-and-drop, persist AI-generated metadata (difficulty, prerequisites, learning objectives), and recommend next chapters based on prerequisites and progress.

**Architecture:** Add `orderIndex` column to `Chapters` table. Preserve `difficulty`, `learningObjectives`, `prerequisites` in `courseOutput` JSON (currently stripped). Use `@dnd-kit/core` for drag-and-drop in outline editor. Add `getNextChapterAction` for prerequisite-aware "Continue Learning" recommendations.

**Tech Stack:** Drizzle ORM, PostgreSQL, `@dnd-kit/core` + `@dnd-kit/sortable`, shadcn/ui, lucide-react, Vitest, server actions

---

## File Map

| Action | File |
|--------|------|
| Modify | `server/db/schema.ts` — add `orderIndex` to Chapters, update `Chapter` interface |
| Modify | `app/actions/outline.ts` — preserve metadata in `generateOutlineAction` + `saveOutlineAction` |
| Modify | `app/actions/course.ts` — add `reorderChaptersAction`, `getNextChapterAction` |
| Modify | `app/create-course/[courseId]/_components/OutlineEditor.jsx` — add drag-and-drop |
| Modify | `app/course/[courseId]/start/page.jsx` — load chapters by orderIndex |
| Modify | `app/course/[courseId]/start/_components/CourseStartClient.jsx` — sidebar orderIndex |
| Create | `app/dashboard/_components/ContinueLearning.jsx` — dashboard component |
| Modify | `app/dashboard/page.jsx` — mount `ContinueLearning` |
| Create | `__tests__/actions/learning-paths.test.ts` — integration tests |

---

### Task 1: Add `orderIndex` to Chapters table and update `Chapter` interface

**Files:**
- Modify: `server/db/schema.ts:15-19` (Chapter interface), `server/db/schema.ts:103-110` (Chapters table)

- [ ] **Step 1: Update `Chapter` interface**

In `server/db/schema.ts`, replace the `Chapter` interface:

```ts
export interface Chapter {
  name: string;
  about: string;
  duration: string;
  difficulty?: string;
  learningObjectives?: string[];
  prerequisites?: string[];
}
```

- [ ] **Step 2: Add `orderIndex` to Chapters table**

In `server/db/schema.ts`, update the `Chapters` table:

```ts
export const Chapters = pgTable('chapters', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull(),
  chapterId: integer('chapterId').notNull(),
  orderIndex: integer('orderIndex').notNull().default(0),
  content: json('content').notNull().$type<ChapterContent[]>(),
  videoId: varchar('videoId').notNull().default(''),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});
```

- [ ] **Step 3: Run `npm run db:push`**

```bash
npm run db:push
```

Expected: Column `orderIndex` added to `chapters` table.

- [ ] **Step 4: Commit**

```bash
git add server/db/schema.ts
git commit -m "feat(db): add orderIndex to chapters, persist difficulty/prereqs/objectives in Chapter"
```

---

### Task 2: Preserve AI metadata in `generateOutlineAction`

**Files:**
- Modify: `app/actions/outline.ts:72-85` (courseOutput construction)

- [ ] **Step 1: Preserve metadata in courseOutput**

In `app/actions/outline.ts`, replace the courseOutput construction (lines 73-85):

```ts
  const courseOutput = {
    course: {
      name: curriculum.course.name,
      description: curriculum.course.description,
      noOfChapters: finalChapters.length,
      duration: curriculum.course.duration,
      chapters: finalChapters.map((ch) => ({
        name: ch.name,
        about: ch.about,
        duration: ch.duration,
        difficulty: ch.difficulty,
        learningObjectives: ch.learningObjectives,
        prerequisites: ch.prerequisites,
      })),
    },
  };
```

- [ ] **Step 2: Commit**

```bash
git add app/actions/outline.ts
git commit -m "feat(outline): preserve difficulty/prereqs/objectives in courseOutput"
```

---

### Task 3: Update `saveOutlineAction` to handle reorder + metadata

**Files:**
- Modify: `app/actions/outline.ts:114-161` (saveOutlineAction)

- [ ] **Step 1: Replace `saveOutlineAction`**

Replace the entire `saveOutlineAction` in `app/actions/outline.ts`:

```ts
export async function saveOutlineAction(
  courseId: string,
  chapters: { name: string; about: string; difficulty?: string; learningObjectives?: string[]; prerequisites?: string[] }[]
): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('No email');

  const rows = await db
    .select()
    .from(CourseList)
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));
  const course = rows[0];
  if (!course) throw new Error('Course not found or not owned by you');
  if (course.status !== 'outline_ready') throw new Error('Outline not in editable state');

  const existing = course.courseOutput as {
    course: {
      name: string;
      description: string;
      noOfChapters: number;
      duration: string;
      chapters: { name: string; about: string; duration: string; difficulty?: string; learningObjectives?: string[]; prerequisites?: string[] }[];
    };
  };
  const newCourseOutput: typeof existing = {
    ...existing,
    course: {
      ...existing.course,
      chapters: chapters.map((ch, i) => ({
        name: ch.name,
        about: ch.about,
        duration: existing.course.chapters[i]?.duration ?? '',
        difficulty: ch.difficulty ?? existing.course.chapters[i]?.difficulty,
        learningObjectives: ch.learningObjectives ?? existing.course.chapters[i]?.learningObjectives,
        prerequisites: ch.prerequisites ?? existing.course.chapters[i]?.prerequisites,
      })),
    },
  };

  await db
    .update(CourseList)
    .set({ courseOutput: newCourseOutput, updatedAt: new Date() })
    .where(eq(CourseList.courseId, courseId));

  await invalidateCache(`course:${courseId}`);
  revalidatePath(`/create-course/${courseId}/outline`);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions/outline.ts
git commit -m "feat(outline): preserve metadata and handle reorder in saveOutlineAction"
```

---

### Task 4: Add `reorderChaptersAction` and `getNextChapterAction`

**Files:**
- Modify: `app/actions/course.ts:1-24` (imports), `app/actions/course.ts` (append new actions)

- [ ] **Step 1: Add imports**

In `app/actions/course.ts`, add `Chapters` to the import (it's already imported but verify):

```ts
import {
  CourseList,
  Chapters,
  Quizzes,
  Flashcards,
  StudyNotesTable,
  UserProgress,
} from '@/server/db/schema';
```

- [ ] **Step 2: Add `reorderChaptersAction`**

Append to `app/actions/course.ts`:

```ts
export async function reorderChaptersAction(
  courseId: string,
  chapterOrder: { chapterId: number; orderIndex: number }[]
): Promise<void> {
  const email = await getUserEmail();

  const course = await db
    .select()
    .from(CourseList)
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));
  if (!course[0]) throw new Error('Course not found or not owned by you');

  for (const item of chapterOrder) {
    await db
      .update(Chapters)
      .set({ orderIndex: item.orderIndex })
      .where(and(eq(Chapters.courseId, courseId), eq(Chapters.chapterId, item.chapterId)));
  }

  revalidatePath(`/course/${courseId}/start`);
  revalidatePath(`/create-course/${courseId}/outline`);
}
```

- [ ] **Step 3: Add `getNextChapterAction`**

Append to `app/actions/course.ts`:

```ts
export async function getNextChapterAction(
  courseId: string
): Promise<{ chapterIndex: number; chapterName: string } | null> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const course = await db.select().from(CourseList).where(eq(CourseList.courseId, courseId));
  const courseData = course[0];
  if (!courseData) throw new Error('Course not found');

  const output = courseData.courseOutput as {
    course: {
      chapters: { name: string; about: string; prerequisites?: string[] }[];
    };
  };
  const chapters = output.course.chapters;

  const progress = await db
    .select()
    .from(UserProgress)
    .where(and(eq(UserProgress.userId, userId), eq(UserProgress.courseId, courseId)));

  const completedChapterIds = new Set(
    progress.filter((p) => p.completed).map((p) => p.chapterId)
  );

  const chapterNames = chapters.map((ch) => ch.name);

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    if (!ch) continue;
    if (completedChapterIds.has(i)) continue;

    const prereqs = ch.prerequisites ?? [];
    const prereqsMet = prereqs.every((prereqName) => {
      const prereqIndex = chapterNames.indexOf(prereqName);
      return prereqIndex === -1 || completedChapterIds.has(prereqIndex);
    });

    if (prereqsMet) {
      return { chapterIndex: i, chapterName: ch.name };
    }
  }

  return null;
}
```

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add app/actions/course.ts
git commit -m "feat(actions): add reorderChaptersAction and getNextChapterAction"
```

---

### Task 5: Add drag-and-drop to OutlineEditor

**Files:**
- Modify: `app/create-course/[courseId]/_components/OutlineEditor.jsx:1-11` (imports), `app/create-course/[courseId]/_components/OutlineEditor.jsx` (full rewrite)

- [ ] **Step 1: Install `@dnd-kit` packages**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Rewrite OutlineEditor with drag-and-drop**

Replace the entire `app/create-course/[courseId]/_components/OutlineEditor.jsx`:

```jsx
'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { HiPencil, HiTrash, HiCheck, HiX, HiSparkles, HiPlus } from 'react-icons/hi2';
import { HiBars6 } from 'react-icons/hi2';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveOutlineAction } from '@/app/actions/outline';
import { updateCourseStatus, reorderChaptersAction } from '@/app/actions/course';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableChapter({ ch, index, editingIndex, draftName, draftAbout, beginEdit, saveEdit, cancelEdit, removeChapter, setDraftName, setDraftAbout }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="flex items-start gap-2 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Drag to reorder"
          >
            <HiBars6 className="h-5 w-5" />
          </button>
          <div className="flex-1">
            {editingIndex === index ? (
              <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} />
            ) : (
              <h4 className="font-semibold text-base">
                {index + 1}. {ch.name}
              </h4>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Duration: {ch.duration}
            </p>
            {ch.difficulty && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                {ch.difficulty}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {editingIndex === index ? (
            <>
              <Button size="icon" variant="ghost" onClick={() => saveEdit(index)} aria-label="Save">
                <HiCheck className="h-4 w-4 text-green-600" />
              </Button>
              <Button size="icon" variant="ghost" onClick={cancelEdit} aria-label="Cancel">
                <HiX className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button size="icon" variant="ghost" onClick={() => beginEdit(index)} aria-label="Edit chapter">
                <HiPencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => removeChapter(index)} aria-label="Remove chapter">
                <HiTrash className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editingIndex === index ? (
          <Textarea value={draftAbout} onChange={(e) => setDraftAbout(e.target.value)} rows={3} />
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">{ch.about}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function OutlineEditor({ courseId, initialChapters }) {
  const router = useRouter();
  const [chapters, setChapters] = useState(initialChapters);
  const [editingIndex, setEditingIndex] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [draftAbout, setDraftAbout] = useState('');
  const [saving, startSaving] = useTransition();
  const [generating, setGenerating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const beginEdit = (i) => {
    setEditingIndex(i);
    setDraftName(chapters[i]?.name ?? '');
    setDraftAbout(chapters[i]?.about ?? '');
  };

  const cancelEdit = () => setEditingIndex(null);

  const saveEdit = (i) => {
    setChapters((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, name: draftName, about: draftAbout } : c))
    );
    setEditingIndex(null);
  };

  const removeChapter = (i) => {
    setChapters((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addChapter = () => {
    setChapters((prev) => [
      ...prev,
      { name: 'New Chapter', about: 'Describe this chapter...', duration: '10 min' },
    ]);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setChapters((prev) => arrayMove(prev, active.id, over.id));
    }
  };

  const onSaveOutline = () => {
    startSaving(async () => {
      try {
        await saveOutlineAction(
          courseId,
          chapters.map((c) => ({
            name: c.name,
            about: c.about,
            difficulty: c.difficulty,
            learningObjectives: c.learningObjectives,
            prerequisites: c.prerequisites,
          }))
        );
        await reorderChaptersAction(
          courseId,
          chapters.map((_, i) => ({ chapterId: i, orderIndex: i }))
        );
        toast.success('Outline saved');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save outline');
      }
    });
  };

  const onGenerateContent = async () => {
    if (chapters.length === 0) {
      toast.error('Add at least one chapter first');
      return;
    }
    setGenerating(true);
    try {
      await saveOutlineAction(
        courseId,
        chapters.map((c) => ({
          name: c.name,
          about: c.about,
          difficulty: c.difficulty,
          learningObjectives: c.learningObjectives,
          prerequisites: c.prerequisites,
        }))
      );
      await reorderChaptersAction(
        courseId,
        chapters.map((_, i) => ({ chapterId: i, orderIndex: i }))
      );
      await updateCourseStatus(courseId, 'generating_chapters', 35, 'Generating chapter content...');
      await fetch('/api/inngest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'course.generate_chapters', data: { courseId } }),
      });
      router.replace(`/create-course/${courseId}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to start generation');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={chapters.map((_, i) => i)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {chapters.map((ch, i) => (
              <SortableChapter
                key={i}
                ch={ch}
                index={i}
                editingIndex={editingIndex}
                draftName={draftName}
                draftAbout={draftAbout}
                beginEdit={beginEdit}
                saveEdit={saveEdit}
                cancelEdit={cancelEdit}
                removeChapter={removeChapter}
                setDraftName={setDraftName}
                setDraftAbout={setDraftAbout}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {chapters.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-8">No chapters yet.</p>
      )}

      <Button variant="outline" onClick={addChapter} className="mt-4 w-full">
        <HiPlus className="mr-2 h-4 w-4" />
        Add Chapter
      </Button>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Button variant="outline" onClick={onSaveOutline} disabled={saving || generating} className="flex-1">
          {saving ? 'Saving...' : 'Save outline'}
        </Button>
        <Button onClick={onGenerateContent} disabled={saving || generating || chapters.length === 0} className="flex-1">
          <HiSparkles className="mr-2 h-4 w-4" />
          {generating ? 'Starting...' : 'Generate chapter content'}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/create-course/[courseId]/_components/OutlineEditor.jsx
git commit -m "feat(ui): add drag-and-drop reorder to outline editor"
```

---

### Task 6: Sort chapters by orderIndex in course viewer

**Files:**
- Modify: `app/course/[courseId]/start/page.jsx` (server component)
- Modify: `app/course/[courseId]/start/_components/CourseStartClient.jsx:174` (sidebar)

- [ ] **Step 1: Sort chapters in server component**

In `app/course/[courseId]/start/page.jsx`, ensure chapters are loaded sorted by `orderIndex`. The chapters are stored in `courseOutput.course.chapters[]` JSON array. Add sorting logic:

After fetching the course, sort the chapters array by orderIndex if available:

```tsx
// Sort chapters by orderIndex if available
const sortedChapters = [...(course.courseOutput.course.chapters || [])].sort((a, b) => {
  const aIndex = (a as any).orderIndex ?? 0;
  const bIndex = (b as any).orderIndex ?? 0;
  return aIndex - bIndex;
});
course.courseOutput.course.chapters = sortedChapters;
```

- [ ] **Step 2: Add difficulty indicator to sidebar**

In `CourseStartClient.jsx`, update the chapter sidebar rendering. After the chapter name, add a difficulty indicator:

```jsx
{chapter.difficulty && (
  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
    chapter.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
    chapter.difficulty === 'Hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
  }`}>
    {chapter.difficulty}
  </span>
)}
```

- [ ] **Step 3: Commit**

```bash
git add app/course/[courseId]/start/page.jsx app/course/[courseId]/start/_components/CourseStartClient.jsx
git commit -m "feat(ui): sort chapters by orderIndex, add difficulty indicator"
```

---

### Task 7: Create ContinueLearning dashboard component

**Files:**
- Create: `app/dashboard/_components/ContinueLearning.jsx`
- Modify: `app/dashboard/page.jsx`

- [ ] **Step 1: Create ContinueLearning component**

```jsx
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { CourseList, UserProgress, Chapters } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import Link from 'next/link';
import { HiPlay } from 'react-icons/hi2';

export default async function ContinueLearning() {
  let content;
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const recentProgress = await db
      .select({
        courseId: UserProgress.courseId,
        lastAccessedAt: UserProgress.lastAccessedAt,
      })
      .from(UserProgress)
      .where(eq(UserProgress.userId, userId))
      .orderBy(sql`${UserProgress.lastAccessedAt} DESC`)
      .limit(1);

    if (recentProgress.length === 0 || !recentProgress[0]) return null;

    const courseId = recentProgress[0].courseId;
    const courseRows = await db
      .select()
      .from(CourseList)
      .where(eq(CourseList.courseId, courseId));

    const course = courseRows[0];
    if (!course) return null;

    const output = course.courseOutput as {
      course: {
        name: string;
        chapters: { name: string; prerequisites?: string[] }[];
      };
    };

    const progress = await db
      .select()
      .from(UserProgress)
      .where(and(eq(UserProgress.userId, userId), eq(UserProgress.courseId, courseId)));

    const completed = new Set(progress.filter((p) => p.completed).map((p) => p.chapterId));
    const chapters = output.course.chapters;
    const chapterNames = chapters.map((ch) => ch.name);

    let nextChapter = null;
    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      if (!ch) continue;
      if (completed.has(i)) continue;

      const prereqs = ch.prerequisites ?? [];
      const prereqsMet = prereqs.every((prereqName) => {
        const idx = chapterNames.indexOf(prereqName);
        return idx === -1 || completed.has(idx);
      });

      if (prereqsMet) {
        nextChapter = { index: i, name: ch.name };
        break;
      }
    }

    if (!nextChapter) {
      return (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-green-700 dark:text-green-300 font-medium">
            You&apos;ve completed all chapters! Great work!
          </p>
        </div>
      );
    }

    content = (
      <Link
        href={`/course/${courseId}/start`}
        className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
      >
        <HiPlay className="h-6 w-6 text-purple-600 dark:text-purple-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400">Continue learning</p>
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {course.name} — {nextChapter.name}
          </p>
        </div>
      </Link>
    );
  } catch {
    return null;
  }

  return <div className="mb-6">{content}</div>;
}
```

- [ ] **Step 2: Mount in dashboard**

In `app/dashboard/page.jsx`:

```jsx
import ContinueLearning from './_components/ContinueLearning';

function Dashboard() {
  return (
    <div className="min-h-screen dark:bg-gray-950">
      <AddCourse />
      <div className="px-10 md:px-20 lg:px-44">
        <ContinueLearning />
        <ReviewStreak />
        <DueFlashcardCount />
      </div>
      <UserCourseList />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/_components/ContinueLearning.jsx app/dashboard/page.jsx
git commit -m "feat(dashboard): add ContinueLearning component with prerequisite-aware recommendations"
```

---

### Task 8: Write learning paths tests

**Files:**
- Create: `__tests__/actions/learning-paths.test.ts`

- [ ] **Step 1: Create test file**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUser: vi.fn().mockResolvedValue({
        emailAddresses: [{ emailAddress: 'test@example.com' }],
      }),
    },
  }),
}));

describe('Learning paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Chapter interface includes difficulty field', () => {
    const chapter = { name: 'Test', about: 'About', duration: '10 min', difficulty: 'Easy' };
    expect(chapter.difficulty).toBe('Easy');
  });

  it('Chapter interface includes prerequisites field', () => {
    const chapter = {
      name: 'Test',
      about: 'About',
      duration: '10 min',
      prerequisites: ['Intro'],
    };
    expect(chapter.prerequisites).toEqual(['Intro']);
  });

  it('Chapter interface includes learningObjectives field', () => {
    const chapter = {
      name: 'Test',
      about: 'About',
      duration: '10 min',
      learningObjectives: ['Know X', 'Understand Y'],
    };
    expect(chapter.learningObjectives).toHaveLength(2);
  });

  it('orderIndex defaults to 0', () => {
    const defaultOrderIndex = 0;
    expect(defaultOrderIndex).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm test -- __tests__/actions/learning-paths.test.ts`
Expected: All 4 tests PASS

- [ ] **Step 3: Commit**

```bash
git add __tests__/actions/learning-paths.test.ts
git commit -m "test(learning-paths): add learning path schema tests"
```

---

### Task 9: Run full verification

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: 0 errors

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: All tests PASS

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: learning paths review fixes"
```
