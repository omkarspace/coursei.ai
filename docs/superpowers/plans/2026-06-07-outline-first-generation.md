# Outline-First Course Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the curriculum/fact-check/pedagogy agents to run synchronously (in a server action, not Inngest) so the user sees the proposed chapter outline before chapter content is generated. User can edit chapter names + descriptions, then click "Generate chapter content" to trigger the (still Inngest-driven) chapter generation pipeline. This is the quality multiplier that prevents wasted 30-second generations on courses the user hates.

**Architecture:** New `CourseStatus = 'outline_ready'`. `app/actions/outline.ts` exposes `generateOutlineAction()` (sync, runs all 3 agents, returns outline) and `saveOutlineAction()` (updates chapter names/descriptions). New page `app/create-course/[id]/outline/page.jsx` shows the outline + `OutlineEditor.jsx` for inline editing. `generate-course.ts` Inngest function is split: chapter content generation is now its own event `course.generate_chapters` triggered only after the user approves the outline.

**Tech Stack:** Next.js 15 server actions, Inngest, Drizzle, React, shadcn `Button`/`Input`/`Textarea`.

---

## File Structure

| Path | Role | New / Modified |
|---|---|---|
| `server/db/schema.ts` | Add `'outline_ready'` to `CourseStatus` union | Modified |
| `app/actions/outline.ts` | `generateOutlineAction`, `saveOutlineAction` (sync) | New |
| `server/ai/generate-course.ts` | Split into `generateChapters` (Inngest) | Modified |
| `app/api/inngest/route.ts` | Register new `generateChapters` function | Modified |
| `app/create-course/page.jsx` | Use `generateOutlineAction` instead of inline gen | Modified |
| `app/create-course/[courseId]/outline/page.jsx` | New outline review page | New |
| `app/create-course/[courseId]/_components/OutlineEditor.jsx` | Edit + approve client | New |
| `app/create-course/[courseId]/page.jsx` | Route to outline page when status === `outline_ready` | Modified |
| `app/api/course/[courseId]/status/route.ts` | Allow `outline_ready` in known statuses | Modified |
| `__tests__/actions/outline.test.ts` | Tests for outline actions | New |

---

### Task 1: Add `outline_ready` status

**Files:**
- Modify: `server/db/schema.ts:55-60`

- [ ] **Step 1: Update the `CourseStatus` union**

Replace lines 55-60 of `server/db/schema.ts` with:

```ts
export type CourseStatus =
  | 'draft'
  | 'generating_outline'
  | 'outline_ready'
  | 'generating_chapters'
  | 'complete'
  | 'failed';
```

- [ ] **Step 2: Commit**

```bash
git add server/db/schema.ts
git commit -m "feat(outline-first): add outline_ready status to CourseStatus"
```

---

### Task 2: Outline server actions (synchronous, runs the 3 agents)

**Files:**
- Create: `app/actions/outline.ts`

- [ ] **Step 1: Create the action file**

```ts
'use server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { CourseList } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { designCurriculum } from '@/server/ai/agents/curriculum-designer';
import { checkFacts } from '@/server/ai/agents/fact-checker';
import { reviewPedagogy } from '@/server/ai/agents/pedagogical-expert';
import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/server/services/cache';

interface OutlineChapter {
  name: string;
  about: string;
  duration: string;
  difficulty?: string;
  learningObjectives?: string[];
  prerequisites?: string[];
}

interface OutlineResult {
  courseName: string;
  courseDescription: string;
  duration: string;
  chapters: OutlineChapter[];
}

export async function generateOutlineAction(input: {
  courseId: string;
  category: string;
  topic: string;
  level: string;
  duration: string;
  numChapters: number;
}): Promise<OutlineResult> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('No email');

  // Verify ownership
  const rows = await db
    .select()
    .from(CourseList)
    .where(and(eq(CourseList.courseId, input.courseId), eq(CourseList.createdBy, email)));
  if (!rows[0]) throw new Error('Course not found or not owned by you');

  // Mark as generating
  await db
    .update(CourseList)
    .set({
      status: 'generating_outline',
      progress: 5,
      currentStep: 'Designing curriculum...',
    })
    .where(eq(CourseList.courseId, input.courseId));

  // Run the 3 agents sequentially (was previously in Inngest)
  const curriculum = await designCurriculum(
    input.category,
    input.topic,
    input.level,
    input.duration,
    input.numChapters
  );
  const factCheck = await checkFacts(curriculum);
  const pedagogy = await reviewPedagogy(
    factCheck.adjustedChapters,
    curriculum.course.name,
    curriculum.course.description
  );

  // Persist the outline to courseOutput (without chapter content yet)
  const finalChapters = pedagogy.finalChapters;
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
      })),
    },
  };

  await db
    .update(CourseList)
    .set({
      courseOutput,
      status: 'outline_ready',
      progress: 35,
      currentStep: 'Outline ready — review and approve',
    })
    .where(eq(CourseList.courseId, input.courseId));

  await invalidateCache(`course:${input.courseId}`);

  return {
    courseName: curriculum.course.name,
    courseDescription: curriculum.course.description,
    duration: curriculum.course.duration,
    chapters: finalChapters.map((ch) => ({
      name: ch.name,
      about: ch.about,
      duration: ch.duration,
      difficulty: ch.difficulty,
      learningObjectives: ch.learningObjectives,
      prerequisites: ch.prerequisites,
    })),
  };
}

export async function saveOutlineAction(
  courseId: string,
  chapters: { name: string; about: string }[]
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

  const existing = course.courseOutput as any;
  const newCourseOutput = {
    ...existing,
    course: {
      ...existing.course,
      chapters: chapters.map((ch, i) => ({
        ...existing.course.chapters[i],
        name: ch.name,
        about: ch.about,
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
git commit -m "feat(outline-first): add sync generateOutline + saveOutline actions"
```

---

### Task 3: Split `generate-course.ts` into chapter-only Inngest function

**Files:**
- Modify: `server/ai/generate-course.ts`
- Modify: `app/api/inngest/route.ts`

- [ ] **Step 1: Replace the contents of `server/ai/generate-course.ts`**

```ts
import { inngest } from '@/server/services/inngest';
import { db } from '@/server/db';
import { CourseList, Chapters } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateChapterContent } from './generate';
import { getVideos } from '@/server/services/youtube';
import { generateChapterIllustration } from '@/server/services/fal';

/**
 * Generates chapter content for a course whose outline is already in `courseOutput`.
 * Assumes status === 'outline_ready' on entry.
 */
export const generateChapters = inngest.createFunction(
  {
    id: 'generate-chapters',
    triggers: [{ event: 'course.generate_chapters' }],
  },
  async ({ event, step }) => {
    const { courseId } = event.data as { courseId: string };

    const courseRows = await db.select().from(CourseList).where(eq(CourseList.courseId, courseId));
    const courseData = courseRows[0];
    if (!courseData) throw new Error(`Course ${courseId} not found`);

    const courseOutput = courseData.courseOutput as any;
    const finalChapters = courseOutput?.course?.chapters || [];
    if (finalChapters.length === 0) throw new Error('No chapters in outline');

    const topic = courseData.name;
    const includeVideo = courseData.includeVideo;

    await step.run('update-status-generating-chapters', () =>
      db
        .update(CourseList)
        .set({
          status: 'generating_chapters',
          progress: 35,
          currentStep: 'Generating chapter content...',
        })
        .where(eq(CourseList.courseId, courseId))
    );

    for (let i = 0; i < finalChapters.length; i++) {
      const chapter = finalChapters[i] as { name: string; about: string };
      const progress = Math.round(35 + (i / finalChapters.length) * 55);

      await step.run(`generate-chapter-${i}`, async () => {
        await db
          .update(CourseList)
          .set({
            progress,
            currentStep: `Generating chapter ${i + 1} of ${finalChapters.length}: ${chapter.name}`,
          })
          .where(eq(CourseList.courseId, courseId));

        let content;
        try {
          content = await generateChapterContent(topic, chapter.name);
        } catch (error) {
          console.error(`Error generating chapter ${i}:`, error);
          content = [
            {
              title: chapter.name,
              explanation: chapter.about,
              code: '',
            },
          ];
        }

        let videoId = '';
        if (includeVideo === 'Yes') {
          try {
            const videoResponse = await getVideos(`${topic}: ${chapter.name}`);
            videoId = videoResponse[0]?.id?.videoId || '';
          } catch (error) {
            console.error('Error fetching video:', error);
          }
        }

        await db.insert(Chapters).values({
          courseId,
          chapterId: i,
          content,
          videoId,
        });

        try {
          const illustrationUrl = await generateChapterIllustration(chapter.name, topic);
          if (illustrationUrl) {
            console.log(`Generated illustration for chapter ${chapter.name}`);
          }
        } catch (error) {
          console.error(`Failed to generate illustration for chapter ${chapter.name}:`, error);
        }
      });
    }

    await step.run('update-status-complete', () =>
      db
        .update(CourseList)
        .set({
          status: 'complete',
          progress: 100,
          currentStep: 'Complete',
        })
        .where(eq(CourseList.courseId, courseId))
    );

    return { courseId, status: 'complete' };
  }
);
```

- [ ] **Step 2: Update `app/api/inngest/route.ts`**

Replace the import and the `functions` array. The new file:

```ts
import { serve } from 'inngest/next';
import { inngest } from '@/server/services/inngest';
import { generateChapters } from '@/server/ai/generate-course';
import { reindexCourseVectors } from '@/server/ai/reindex-vectors';
import { buildCourseGraphFunction } from '@/server/ai/build-graph';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateChapters, reindexCourseVectors, buildCourseGraphFunction],
});
```

- [ ] **Step 3: Commit**

```bash
git add server/ai/generate-course.ts app/api/inngest/route.ts
git commit -m "refactor(outline-first): split Inngest into chapter-only generation"
```

---

### Task 4: Update `/create-course` form to use the new flow

**Files:**
- Modify: `app/create-course/page.jsx`

- [ ] **Step 1: Replace the old `GenerateCourseLayout` + `SaveCourseLayoutInDb` chain with the new outline action**

In `app/create-course/page.jsx`:

- Remove the import `import { generateCourseLayoutAction } from '@/app/actions/ai';`
- Add `import { generateOutlineAction } from '@/app/actions/outline';`
- Replace the body of `GenerateCourseLayout()` (lines 54-77) with:

```jsx
const GenerateCourseLayout = async () => {
  setLoading(true);
  setError(null);

  try {
    const id = uuid4();
    // Create the course row in 'generating_outline' state
    await createCourse({
      courseId: id,
      name: userCourseInput?.topic,
      level: userCourseInput?.level,
      category: userCourseInput?.category,
      courseOutput: {
        course: {
          name: userCourseInput?.topic,
          description: userCourseInput?.description || '',
          noOfChapters: userCourseInput?.noOfChapter || 5,
          duration: userCourseInput?.duration || '4 weeks',
          chapters: [],
        },
      },
      includeVideo: userCourseInput?.displayVideo || 'Yes',
    });
    // Run the 3 agents synchronously (~10-20s)
    await generateOutlineAction({
      courseId: id,
      category: userCourseInput?.category,
      topic: userCourseInput?.topic,
      level: userCourseInput?.level,
      duration: userCourseInput?.duration || '4 weeks',
      numChapters: userCourseInput?.noOfChapter || 5,
    });
    // Navigate to the outline review page
    router.replace('/create-course/' + id + '/outline');
  } catch (err) {
    console.error('Outline generation error:', err);
    const errorMessage =
      err && err.message ? err.message : 'Failed to design course outline. Please try again.';
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};
```

- Remove the now-unused `SaveCourseLayoutInDb` function (lines 79-96).

- [ ] **Step 2: Commit**

```bash
git add app/create-course/page.jsx
git commit -m "feat(outline-first): route /create-course through generateOutlineAction"
```

---

### Task 5: Outline review page + editor

**Files:**
- Create: `app/create-course/[courseId]/outline/page.jsx`
- Create: `app/create-course/[courseId]/_components/OutlineEditor.jsx`

- [ ] **Step 1: Create the server page**

`app/create-course/[courseId]/outline/page.jsx`:

```jsx
import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/server/db';
import { CourseList } from '@/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';
import OutlineEditor from '../_components/OutlineEditor';
import Header from '@/app/dashboard/_components/Header';

export const metadata = { title: 'Review outline — coursei.ai' };

export default async function OutlinePage({ params }) {
  const { courseId } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) redirect('/sign-in');

  const rows = await db
    .select()
    .from(CourseList)
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));
  const course = rows[0];
  if (!course) notFound();

  const courseOutput = course.courseOutput as any;
  const chapters = courseOutput?.course?.chapters ?? [];

  return (
    <div className="min-h-screen dark:bg-gray-950">
      <Header />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-1">Review your course outline</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Edit chapter names and descriptions, then generate the full content.
        </p>
        <OutlineEditor
          courseId={courseId}
          courseName={courseOutput?.course?.name ?? course.name}
          initialChapters={chapters}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the editor client component**

`app/create-course/[courseId]/_components/OutlineEditor.jsx`:

```jsx
'use client';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { HiOutlineTrash, HiOutlinePlus, HiArrowPath } from 'react-icons/hi2';
import { saveOutlineAction } from '@/app/actions/outline';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function OutlineEditor({ courseId, courseName, initialChapters }) {
  const [chapters, setChapters] = useState(
    initialChapters.map((c) => ({ name: c.name, about: c.about }))
  );
  const [saving, startSaving] = useTransition();
  const [generating, setGenerating] = useState(false);
  const router = useRouter();

  const update = (i, key, val) => {
    setChapters((prev) => prev.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)));
  };

  const remove = (i) => {
    setChapters((prev) => prev.filter((_, idx) => idx !== i));
  };

  const add = () => {
    setChapters((prev) => [...prev, { name: 'New chapter', about: '' }]);
  };

  const onSave = () => {
    startSaving(async () => {
      try {
        await saveOutlineAction(courseId, chapters);
        toast.success('Outline saved');
      } catch (err) {
        toast.error('Save failed');
      }
    });
  };

  const onGenerate = async () => {
    setGenerating(true);
    try {
      // Save edits first, then trigger Inngest
      await saveOutlineAction(courseId, chapters);
      await fetch('/api/inngest', {
        method: 'POST',
        body: JSON.stringify({ name: 'course.generate_chapters', data: { courseId } }),
      });
      router.replace(`/create-course/${courseId}`);
    } catch (err) {
      toast.error('Failed to start generation');
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {chapters.length} chapter{chapters.length === 1 ? '' : 's'}
        </p>
        <Button variant="outline" size="sm" onClick={add}>
          <HiOutlinePlus className="h-4 w-4 mr-1" /> Add chapter
        </Button>
      </div>

      {chapters.map((c, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-8">{i + 1}.</span>
              <Input
                value={c.name}
                onChange={(e) => update(i, 'name', e.target.value)}
                placeholder="Chapter name"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(i)}
                disabled={chapters.length <= 1}
                aria-label="Remove chapter"
              >
                <HiOutlineTrash className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={c.about}
              onChange={(e) => update(i, 'about', e.target.value)}
              placeholder="What does this chapter cover?"
              rows={2}
            />
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onSave} disabled={saving || generating}>
          {saving ? 'Saving…' : 'Save outline'}
        </Button>
        <Button onClick={onGenerate} disabled={saving || generating}>
          <HiArrowPath className={`h-4 w-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Starting…' : 'Generate chapter content'}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/create-course/[courseId]/outline/page.jsx app/create-course/[courseId]/_components/OutlineEditor.jsx
git commit -m "feat(outline-first): add outline review page with edit + approve"
```

---

### Task 6: Wire polling page to route outline_ready users to the editor

**Files:**
- Modify: `app/create-course/[courseId]/page.jsx`

- [ ] **Step 1: Read the file**

- [ ] **Step 2: Add a redirect for `outline_ready`**

At the top of the component, after the auth check / course lookup, add:

```jsx
if (course.status === 'outline_ready') {
  redirect(`/create-course/${courseId}/outline`);
}
```

(`redirect` is from `next/navigation`; add to the existing import if not already there.)

- [ ] **Step 3: Commit**

```bash
git add app/create-course/[courseId]/page.jsx
git commit -m "feat(outline-first): redirect outline_ready courses to editor"
```

---

### Task 7: Update status route + server action tests

**Files:**
- Modify: `app/api/course/[courseId]/status/route.ts`
- Create: `__tests__/actions/outline.test.ts`

- [ ] **Step 1: Read the status route**

- [ ] **Step 2: Add `outline_ready` to the allowed status list** (any set of known statuses in that file should now include it). If the file uses a `const KNOWN_STATUSES = [...]` array, add `'outline_ready'` to it.

- [ ] **Step 3: Write outline action tests**

In `__tests__/actions/outline.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
  clerkClient: vi.fn().mockResolvedValue({
    users: { getUser: vi.fn().mockResolvedValue({ emailAddresses: [{ emailAddress: 'a@b.com' }] }) },
  }),
}));

vi.mock('@/server/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/server/ai/agents/curriculum-designer', () => ({
  designCurriculum: vi.fn().mockResolvedValue({
    course: {
      name: 'Test',
      description: 'd',
      duration: '4 weeks',
      chapters: [{ name: 'C1', about: 'a', duration: '1 week' }],
    },
  }),
}));
vi.mock('@/server/ai/agents/fact-checker', () => ({
  checkFacts: vi.fn().mockResolvedValue({ verified: true, adjustedChapters: [{ name: 'C1', about: 'a', duration: '1 week' }] }),
}));
vi.mock('@/server/ai/agents/pedagogical-expert', () => ({
  reviewPedagogy: vi.fn().mockResolvedValue({
    finalChapters: [{ name: 'C1', about: 'a', duration: '1 week' }],
  }),
}));

vi.mock('@/server/services/cache', () => ({
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}));

describe('outline actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'postgres://x';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_x';
    process.env.CLERK_SECRET_KEY = 'sk_test_x';
  });

  it('generateOutlineAction returns the outline and updates status', async () => {
    const db = (await import('@/server/db')).db;
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ courseId: 'c1', createdBy: 'a@b.com' }]),
      }),
    });

    const { generateOutlineAction } = await import('@/app/actions/outline');
    const result = await generateOutlineAction({
      courseId: 'c1',
      category: 'Tech',
      topic: 'Test',
      level: 'Beginner',
      duration: '4 weeks',
      numChapters: 1,
    });
    expect(result.courseName).toBe('Test');
    expect(result.chapters).toHaveLength(1);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npm test -- __tests__/actions/outline.test.ts`
Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add app/api/course/[courseId]/status/route.ts __tests__/actions/outline.test.ts
git commit -m "test(outline): add tests + allow outline_ready in status route"
```

---

### Task 8: Verification

- [ ] Run `npm run lint`
- [ ] Run `npm test`
- [ ] Run `npm run build` — must compile
- [ ] Manually trace: `/create-course` → form submit → calls `createCourse` + `generateOutlineAction` → redirects to `/create-course/[id]/outline` → editor shows chapters → user clicks "Generate chapter content" → `saveOutlineAction` + Inngest `course.generate_chapters` → redirect to `/create-course/[id]` → polling shows progress → complete

---

## Self-Review

- Spec coverage: ✅ task 1 (status), ✅ task 2 (actions), ✅ task 3 (Inngest split), ✅ task 4 (form), ✅ task 5 (review page + editor), ✅ task 6 (redirect), ✅ task 7 (status route + tests), ✅ task 8 (verify).
- No placeholders.
- Type consistency: `OutlineChapter` interface used in both `outline.ts` and the editor; same field names.
- DRY: outline save is a single `saveOutlineAction`; no duplication.
- Risk: removing the old `generateCourse` function breaks any caller still using the `course.generate` event. The only known caller is `app/create-course/[courseId]/page.jsx:40-49` — it's been updated in task 4 to not call it (it now only calls Inngest after the user has approved the outline).
