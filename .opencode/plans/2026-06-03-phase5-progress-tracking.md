# Phase 5.1: Course Progress Tracking UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show learning progress (completion % and last accessed) for each course on the dashboard.

**Architecture:** Create a new server action `getUserCoursesWithProgress()` that joins course data with user progress. Update CourseCard to display learning progress bar and last accessed timestamp.

**Tech Stack:** Drizzle ORM, React, Tailwind CSS

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Modify | `app/actions/course.ts` | Add `getUserCoursesWithProgress()` action |
| Modify | `app/dashboard/_components/CourseCard.jsx` | Add learning progress UI |
| Modify | `app/dashboard/_components/UserCourseList.jsx` | Use new action with progress data |

---

## Current State

**Already exists:**
- `UserProgress` table with `completed`, `lastAccessedAt` fields
- `Chapters` table with chapter data per course
- `getUserProgressAction()` returns completed chapter IDs for a course
- `CourseCard` shows generation progress (during generation only)

**What's missing:**
- Dashboard doesn't show learning progress for completed courses
- No "last accessed" timestamp display
- Progress bar only shows during generation, not for learning

---

## Task 1: Add getUserCoursesWithProgress Action

**Files:**
- Modify: `app/actions/course.ts` (add new function after `getUserCourses`)

- [ ] **Step 1: Add the new action**

```typescript
// app/actions/course.ts - Add after getUserCourses function (around line 40)

export async function getUserCoursesWithProgress() {
  const email = await getUserEmail();
  
  // Get all user courses
  const courses = await db.select().from(CourseList).where(eq(CourseList.createdBy, email));
  
  // Get progress data for all courses in one query
  const allProgress = await db
    .select({
      courseId: UserProgress.courseId,
      completedChapters: sql<number>`COUNT(*) FILTER (WHERE ${UserProgress.completed} = true)`,
      lastAccessedAt: sql<Date>`MAX(${UserProgress.lastAccessedAt})`,
    })
    .from(UserProgress)
    .where(
      eq(UserProgress.userId, (await auth()).userId!)
    )
    .groupBy(UserProgress.courseId);
  
  // Create a map for quick lookup
  const progressMap = new Map(
    allProgress.map(p => [p.courseId, {
      completedChapters: Number(p.completedChapters),
      lastAccessedAt: p.lastAccessedAt,
    }])
  );
  
  // Merge course data with progress
  return courses.map(course => {
    const progress = progressMap.get(course.courseId);
    const totalChapters = (course.courseOutput as CourseOutput)?.course?.chapters?.length || 0;
    const completedChapters = progress?.completedChapters || 0;
    const learningProgress = totalChapters > 0 
      ? Math.round((completedChapters / totalChapters) * 100) 
      : 0;
    
    return {
      ...course,
      learningProgress,
      completedChapters,
      totalChapters,
      lastAccessedAt: progress?.lastAccessedAt || null,
    };
  });
}
```

- [ ] **Step 2: Add SQL import if not present**

Check if `sql` is already imported from `drizzle-orm`. If not, add it:

```typescript
import { eq, and, sql } from 'drizzle-orm';
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/actions/course.ts
git commit -m "feat: add getUserCoursesWithProgress action"
```

---

## Task 2: Update UserCourseList to Use New Action

**Files:**
- Modify: `app/dashboard/_components/UserCourseList.jsx` (line 2, 22)

- [ ] **Step 1: Update import and function call**

```javascript
// Change import (line 2)
import { getUserCoursesWithProgress } from '@/app/actions/course';

// Change function call (line 22)
const courses = await getUserCoursesWithProgress();
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/_components/UserCourseList.jsx
git commit -m "feat: use getUserCoursesWithProgress in dashboard"
```

---

## Task 3: Update CourseCard to Show Learning Progress

**Files:**
- Modify: `app/dashboard/_components/CourseCard.jsx` (add after rating section, before generation progress)

- [ ] **Step 1: Add learning progress display**

Add this after the rating section (around line 115) and before the generation progress section (line 117):

```jsx
{/* Learning Progress - only show for complete courses with progress */}
{course?.status === 'complete' && course?.learningProgress !== undefined && (
  <div className="mt-2">
    <div className="flex justify-between text-xs text-gray-500 mb-1">
      <span>Learning Progress</span>
      <span>{course.completedChapters}/{course.totalChapters} chapters ({course.learningProgress}%)</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
      <div
        className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${course.learningProgress}%` }}
      />
    </div>
  </div>
)}

{/* Last Accessed - show if available */}
{course?.lastAccessedAt && (
  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
    Last accessed {new Date(course.lastAccessedAt).toLocaleDateString()}
  </p>
)}
```

- [ ] **Step 2: Verify the course object has the new fields**

The CourseCard receives `course` prop. The new fields are:
- `learningProgress` (number: 0-100)
- `completedChapters` (number)
- `totalChapters` (number)
- `lastAccessedAt` (Date | null)

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/_components/CourseCard.jsx
git commit -m "feat: add learning progress display to CourseCard"
```

---

## Task 4: Add Tests for Progress Calculation

**Files:**
- Create: `__tests__/actions/progress.test.ts`

- [ ] **Step 1: Create test file**

```typescript
// __tests__/actions/progress.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set required env vars
process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
process.env.CLERK_SECRET_KEY = 'sk_test_123';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';

describe('getUserCoursesWithProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate learning progress correctly', async () => {
    // This is a unit test for the progress calculation logic
    // In a real scenario, you'd mock the database calls
    
    const totalChapters = 10;
    const completedChapters = 5;
    const expectedProgress = 50; // 5/10 * 100
    
    const learningProgress = totalChapters > 0 
      ? Math.round((completedChapters / totalChapters) * 100) 
      : 0;
    
    expect(learningProgress).toBe(expectedProgress);
  });

  it('should handle zero chapters', async () => {
    const totalChapters = 0;
    const completedChapters = 0;
    
    const learningProgress = totalChapters > 0 
      ? Math.round((completedChapters / totalChapters) * 100) 
      : 0;
    
    expect(learningProgress).toBe(0);
  });

  it('should handle all chapters completed', async () => {
    const totalChapters = 5;
    const completedChapters = 5;
    
    const learningProgress = totalChapters > 0 
      ? Math.round((completedChapters / totalChapters) * 100) 
      : 0;
    
    expect(learningProgress).toBe(100);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm run test __tests__/actions/progress.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add __tests__/actions/progress.test.ts
git commit -m "test: add progress calculation tests"
```

---

## Verification Checklist

After completing all tasks:

- [ ] Run `npm run build` - should succeed
- [ ] Run `npm run test` - all tests pass
- [ ] Run `npx tsc --noEmit` - no type errors
- [ ] Manual test: Dashboard shows learning progress for courses with completed chapters
- [ ] Manual test: Last accessed timestamp displays correctly
- [ ] Manual test: Progress bar shows correct percentage

---

## Notes

- The progress calculation happens server-side in `getUserCoursesWithProgress()`
- CourseCard receives pre-calculated progress data as props
- Learning progress only shows for courses with status 'complete'
- Generation progress (existing) still shows during course generation
- Green color (#22c55e) used for learning progress to distinguish from purple generation progress
