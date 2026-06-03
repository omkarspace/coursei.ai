# Plan 5: Caching, Cleanup & Timestamps

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Redis caching for performance, clean up dead config files, display timestamps in the UI, and show generation progress on dashboard course cards.

**Architecture:** Wire up the existing cache service to server actions for frequently-read data. Remove deprecated `configs/` files. Add `createdAt`/`updatedAt` display to course cards and detail pages. Show progress percentage on dashboard course cards for in-progress generations.

**Tech Stack:** Next.js 15, Upstash Redis, Drizzle ORM, Tailwind CSS

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Modify | `app/actions/course.ts` | Add caching to read-heavy actions |
| Modify | `app/actions/rating.ts` | Add caching to rating summary |
| Modify | `app/dashboard/_components/CourseCard.jsx` | Show timestamps, progress |
| Modify | `app/course/[courseId]/_components/CourseClient.jsx` | Show timestamps |
| Modify | `app/create-course/[courseId]/_components/CourseBasicInfo.jsx` | Show createdAt |
| Delete | `configs/db.jsx` | Dead code |
| Delete | `configs/schema.jsx` | Dead code |
| Delete | `configs/service.jsx` | Dead code |
| Delete | `configs/cloudinary.js` | Dead code |

---

### Task 1: Add Caching to Course Server Actions

**Files:**
- Modify: `app/actions/course.ts`

- [ ] **Step 1: Import cache functions**

Add at top:
```typescript
import { getCachedCourse, setCachedCourse, invalidateCourseCache } from "@/server/services/cache";
```

- [ ] **Step 2: Add caching to getCourseById**

Replace `getCourseById`:
```typescript
export async function getCourseById(courseId: string) {
  // Check cache first
  const cached = await getCachedCourse(courseId);
  if (cached) return cached;

  const email = await getUserEmail();
  const courses = await db
    .select()
    .from(CourseList)
    .where(
      and(
        eq(CourseList.courseId, courseId),
        eq(CourseList.createdBy, email)
      )
    );

  const course = courses[0] || null;

  // Cache for 5 minutes
  if (course) {
    await setCachedCourse(courseId, course, 300);
  }

  return course;
}
```

- [ ] **Step 3: Add cache invalidation to mutations**

In `updateCourse`, add after the update:
```typescript
await invalidateCourseCache(courseId);
```

In `deleteCourse`, add before the return:
```typescript
await invalidateCourseCache(courseId);
```

In `publishCourse`, add after the update:
```typescript
await invalidateCourseCache(courseId);
```

In `updateCourseBanner`, add after the update:
```typescript
await invalidateCourseCache(courseId);
```

---

### Task 2: Add Caching to Rating Summary

**Files:**
- Modify: `app/actions/rating.ts`

- [ ] **Step 1: Import cache and add caching**

Add import:
```typescript
import { getCached, setCached } from "@/server/services/cache";
```

Replace `getCourseRatingSummary`:
```typescript
export async function getCourseRatingSummary(courseId: string) {
  const cacheKey = `rating:${courseId}`;
  const cached = await getCached<{ average: number; count: number }>(cacheKey);
  if (cached) return cached;

  const result = await db
    .select({
      average: sql<number>`COALESCE(AVG(${CourseRatings.rating}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(CourseRatings)
    .where(eq(CourseRatings.courseId, courseId));

  const summary = {
    average: Number(result[0]?.average) || 0,
    count: Number(result[0]?.count) || 0,
  };

  await setCached(cacheKey, summary, 300);
  return summary;
}
```

Add cache invalidation in `submitRating` and `deleteRating`:
```typescript
import { getCached, setCached, invalidateCache } from "@/server/services/cache";

// In submitRating, after revalidatePath:
await invalidateCache(`rating:${courseId}`);

// In deleteRating, after revalidatePath:
await invalidateCache(`rating:${courseId}`);
```

---

### Task 3: Add Timestamps to CourseCard

**Files:**
- Modify: `app/dashboard/_components/CourseCard.jsx`

- [ ] **Step 1: Add timestamp display**

After the rating stars section (or after the level badge if no ratings), add:
```jsx
{course?.createdAt && (
  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
    Created {new Date(course.createdAt).toLocaleDateString()}
  </p>
)}
```

- [ ] **Step 2: Add progress display for in-progress courses**

After the status badge area, add progress bar for generating courses:
```jsx
{(course?.status === "generating_outline" || course?.status === "generating_chapters") && (
  <div className="mt-2">
    <div className="flex justify-between text-xs text-gray-500 mb-1">
      <span>{course?.currentStep || "Generating..."}</span>
      <span>{course?.progress || 0}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
      <div
        className="bg-primary h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${course?.progress || 0}%` }}
      />
    </div>
  </div>
)}
```

---

### Task 4: Add Timestamps to Public Course View

**Files:**
- Modify: `app/course/[courseId]/_components/CourseClient.jsx`

- [ ] **Step 1: Add timestamp display**

In the course info area (below CourseDetails), add:
```jsx
<div className="text-sm text-gray-500 dark:text-gray-400">
  {course?.createdAt && (
    <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
  )}
  {course?.updatedAt && course.updatedAt !== course.createdAt && (
    <span> · Updated {new Date(course.updatedAt).toLocaleDateString()}</span>
  )}
</div>
```

---

### Task 5: Add Timestamps to Course Basic Info

**Files:**
- Modify: `app/create-course/[courseId]/_components/CourseBasicInfo.jsx`

- [ ] **Step 1: Add createdAt display**

After the course name/description area, add:
```jsx
{course?.createdAt && (
  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
    Created {new Date(course.createdAt).toLocaleDateString()}
    {course?.updatedAt && course.updatedAt !== course.createdAt && (
      <> · Updated {new Date(course.updatedAt).toLocaleDateString()}</>
    )}
  </p>
)}
```

---

### Task 6: Delete Dead Config Files

**Files:**
- Delete: `configs/db.jsx`
- Delete: `configs/schema.jsx`
- Delete: `configs/service.jsx`
- Delete: `configs/cloudinary.js`

- [ ] **Step 1: Verify these files are not imported anywhere**

Run: `grep -r "configs/db" --include="*.{js,jsx,ts,tsx}" . | grep -v "configs/db.jsx"`
Run: `grep -r "configs/schema" --include="*.{js,jsx,ts,tsx}" . | grep -v "configs/schema.jsx"`
Run: `grep -r "configs/service" --include="*.{js,jsx,ts,tsx}" . | grep -v "configs/service.jsx"`
Run: `grep -r "configs/cloudinary" --include="*.{js,jsx,ts,tsx}" . | grep -v "configs/cloudinary.js"`

Expected: No results (files are not imported)

- [ ] **Step 2: Delete the files**

```bash
rm configs/db.jsx configs/schema.jsx configs/service.jsx configs/cloudinary.js
```

- [ ] **Step 3: Check if configs directory is now empty**

```bash
ls configs/
```

Should only contain `AiModel.jsx` (still used by backward compat, can be deprecated later).

---

### Task 7: Verify and Commit

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 2: Lint check**

Run: `npm run lint 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Redis caching, timestamps, cleanup dead configs"
```

---

## Summary

After this plan:
1. **Redis caching** for course data and rating summaries (5-min TTL)
2. **Cache invalidation** on all mutations (update, delete, publish, rate)
3. **Timestamps** displayed on course cards, detail pages, and basic info
4. **Progress bar** on dashboard for in-progress course generations
5. **Dead config files** cleaned up (db.jsx, schema.jsx, service.jsx, cloudinary.js)
6. **Performance improvement** from reduced database queries
