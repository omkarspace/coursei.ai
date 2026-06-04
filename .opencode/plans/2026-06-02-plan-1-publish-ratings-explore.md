# Plan 1: Publish, Ratings & Explore Filtering

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make courses publishable, add ratings/reviews, and add category/level filtering to explore page.

**Architecture:** Add a Publish button to the dashboard course card dropdown, create a ratings system with server actions and UI, and add filter dropdowns to the explore page that use the existing API query params.

**Tech Stack:** Next.js 15, Drizzle ORM, Neon PostgreSQL, Clerk auth, Tailwind CSS, Radix UI

---

## File Structure

| Action | File                                                 | Purpose                                      |
| ------ | ---------------------------------------------------- | -------------------------------------------- |
| Create | `app/actions/rating.ts`                              | Server actions for rating CRUD               |
| Create | `app/dashboard/_components/PublishButton.jsx`        | Publish toggle component                     |
| Create | `app/dashboard/_components/RatingDialog.jsx`         | Rating/review dialog                         |
| Create | `app/dashboard/_components/CourseFilters.jsx`        | Category & level filter dropdowns            |
| Modify | `app/dashboard/_components/DropDownOption.jsx`       | Add Publish menu item                        |
| Modify | `app/dashboard/_components/CourseCard.jsx`           | Show rating stars                            |
| Modify | `app/dashboard/explore/page.tsx`                     | Add filter UI, pass filters to data fetching |
| Modify | `app/actions/course.ts`                              | Add `getPublishedCoursesWithFilters` action  |
| Modify | `app/course/[courseId]/_components/CourseClient.jsx` | Show average rating, rating dialog           |

---

### Task 1: Create Rating Server Actions

**Files:**

- Create: `app/actions/rating.ts`

- [ ] **Step 1: Create rating server actions file**

```typescript
'use server';

import { db } from '@/server/db';
import { CourseRatings } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function getCourseRatings(courseId: string) {
  const ratings = await db
    .select()
    .from(CourseRatings)
    .where(eq(CourseRatings.courseId, courseId))
    .orderBy(CourseRatings.createdAt);
  return ratings;
}

export async function getCourseRatingSummary(courseId: string) {
  const result = await db
    .select({
      average: sql<number>`COALESCE(AVG(${CourseRatings.rating}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(CourseRatings)
    .where(eq(CourseRatings.courseId, courseId));
  return {
    average: Number(result[0]?.average) || 0,
    count: Number(result[0]?.count) || 0,
  };
}

export async function getUserCourseRating(courseId: string) {
  const { userId } = await auth();
  if (!userId) return null;
  const result = await db
    .select()
    .from(CourseRatings)
    .where(and(eq(CourseRatings.courseId, courseId), eq(CourseRatings.userId, userId)));
  return result[0] || null;
}

export async function submitRating(courseId: string, rating: number, review?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');

  const existing = await db
    .select()
    .from(CourseRatings)
    .where(and(eq(CourseRatings.courseId, courseId), eq(CourseRatings.userId, userId)));

  if (existing[0]) {
    await db
      .update(CourseRatings)
      .set({ rating, review })
      .where(eq(CourseRatings.id, existing[0].id));
  } else {
    await db.insert(CourseRatings).values({ courseId, userId, rating, review });
  }

  revalidatePath(`/course/${courseId}`);
  revalidatePath('/dashboard/explore');
  return { success: true };
}

export async function deleteRating(courseId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  await db
    .delete(CourseRatings)
    .where(and(eq(CourseRatings.courseId, courseId), eq(CourseRatings.userId, userId)));
  revalidatePath(`/course/${courseId}`);
  return { success: true };
}
```

---

### Task 2: Create Publish Button Component

**Files:**

- Create: `app/dashboard/_components/PublishButton.jsx`

- [ ] **Step 1: Create PublishButton component**

```jsx
'use client';
import React, { useState } from 'react';
import { publishCourse } from '@/app/actions/course';
import { toast } from 'sonner';
import { HiOutlineGlobeAlt, HiOutlineCheckCircle } from 'react-icons/hi2';

export default function PublishButton({ course, refreshData }) {
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPublishing(true);
    try {
      await publishCourse(course.courseId);
      toast.success(course?.publish ? 'Course unpublished' : 'Course published to marketplace!');
      refreshData();
    } catch (error) {
      toast.error('Failed to publish course');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <button
      onClick={handlePublish}
      disabled={publishing}
      className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
    >
      {course?.publish ? (
        <>
          <HiOutlineCheckCircle className="h-4 w-4 text-green-500" />
          {publishing ? 'Unpublishing...' : 'Unpublish'}
        </>
      ) : (
        <>
          <HiOutlineGlobeAlt className="h-4 w-4" />
          {publishing ? 'Publishing...' : 'Publish to Marketplace'}
        </>
      )}
    </button>
  );
}
```

---

### Task 3: Add Publish to DropDownOption

**Files:**

- Modify: `app/dashboard/_components/DropDownOption.jsx`

- [ ] **Step 1: Add PublishButton import and menu item**

Add imports and props:

```jsx
import PublishButton from './PublishButton';
```

Add `course` and `refreshData` to the function signature:

```jsx
function DropDownOption({ children, handleOnDelete, course, refreshData }) {
```

Add inside DropdownMenuContent, before the Delete item:

```jsx
<PublishButton course={course} refreshData={refreshData} />
<DropdownMenuSeparator />
```

Add DropdownMenuSeparator import:

```jsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
```

---

### Task 4: Update CourseCard to Pass Props and Show Ratings

**Files:**

- Modify: `app/dashboard/_components/CourseCard.jsx`

- [ ] **Step 1: Add imports**

Add at top:

```jsx
import { useEffect, useState } from 'react';
import { getCourseRatingSummary } from '@/app/actions/rating';
```

- [ ] **Step 2: Add rating state**

After existing state:

```jsx
const [ratingSummary, setRatingSummary] = useState({ average: 0, count: 0 });

useEffect(() => {
  if (course?.courseId) {
    getCourseRatingSummary(course.courseId).then(setRatingSummary);
  }
}, [course?.courseId]);
```

- [ ] **Step 3: Pass course and refreshData to DropDownOption**

Change:

```jsx
<DropDownOption handleOnDelete={handleOnDelete}>
```

To:

```jsx
<DropDownOption handleOnDelete={handleOnDelete} course={course} refreshData={refreshData}>
```

- [ ] **Step 4: Add rating stars display**

After the level badge (line ~82), add:

```jsx
{
  ratingSummary.count > 0 && (
    <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
      <span>{ratingSummary.average.toFixed(1)}</span>
      <span className="text-gray-400">({ratingSummary.count})</span>
    </div>
  );
}
```

---

### Task 5: Create Rating Dialog Component

**Files:**

- Create: `app/dashboard/_components/RatingDialog.jsx`

- [ ] **Step 1: Create RatingDialog**

```jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submitRating, getUserCourseRating } from '@/app/actions/rating';
import { toast } from 'sonner';
import { HiOutlineStar, HiStar } from 'react-icons/hi2';

export default function RatingDialog({ courseId, children }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [existingRating, setExistingRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && courseId) {
      getUserCourseRating(courseId).then((r) => {
        if (r) {
          setExistingRating(r);
          setRating(r.rating);
          setReview(r.review || '');
        }
      });
    }
  }, [open, courseId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await submitRating(courseId, rating, review || undefined);
      toast.success(existingRating ? 'Rating updated!' : 'Rating submitted!');
      setOpen(false);
      setExistingRating(null);
      setRating(0);
      setReview('');
    } catch {
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existingRating ? 'Update Rating' : 'Rate this Course'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="text-2xl focus:outline-none"
                aria-label={`Rate ${star} stars`}
              >
                {star <= (hoveredRating || rating) ? (
                  <HiStar className="text-yellow-500" />
                ) : (
                  <HiOutlineStar className="text-gray-300 dark:text-gray-600" />
                )}
              </button>
            ))}
            {rating > 0 && (
              <span className="text-sm text-gray-500 ml-2 self-center">{rating}/5</span>
            )}
          </div>
          <Textarea
            placeholder="Write a review (optional)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : existingRating ? 'Update' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 6: Add Rating to Public Course View

**Files:**

- Modify: `app/course/[courseId]/_components/CourseClient.jsx`

- [ ] **Step 1: Add imports and state**

Add imports:

```jsx
import { getCourseRatingSummary } from '@/app/actions/rating';
import RatingDialog from '@/app/dashboard/_components/RatingDialog';
import { HiStar, HiOutlineStar } from 'react-icons/hi2';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
```

Add state:

```jsx
const [ratingSummary, setRatingSummary] = useState({ average: 0, count: 0 });

useEffect(() => {
  getCourseRatingSummary(course.courseId).then(setRatingSummary);
}, [course.courseId]);
```

- [ ] **Step 2: Add rating display and button**

Inside the flex container after the fork button, add:

```jsx
<div className="flex items-center gap-4 mt-4">
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) =>
      star <= Math.round(ratingSummary.average) ? (
        <HiStar key={star} className="w-5 h-5 text-yellow-500" />
      ) : (
        <HiOutlineStar key={star} className="w-5 h-5 text-gray-300 dark:text-gray-600" />
      )
    )}
    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
      {ratingSummary.average > 0
        ? `${ratingSummary.average.toFixed(1)} (${ratingSummary.count} rating${ratingSummary.count !== 1 ? 's' : ''})`
        : 'No ratings yet'}
    </span>
  </div>
  <RatingDialog courseId={course.courseId}>
    <Button variant="outline" size="sm">
      Rate this Course
    </Button>
  </RatingDialog>
</div>
```

---

### Task 7: Create Course Filters Component

**Files:**

- Create: `app/dashboard/_components/CourseFilters.jsx`

- [ ] **Step 1: Create CourseFilters**

```jsx
'use client';
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = ['Programming', 'Health', 'Creative Arts', 'Business', 'Robotics', 'Education'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function CourseFilters({
  selectedCategory,
  onCategoryChange,
  selectedLevel,
  onLevelChange,
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={selectedCategory || 'all'}
        onValueChange={(val) => onCategoryChange(val === 'all' ? '' : val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={selectedLevel || 'all'}
        onValueChange={(val) => onLevelChange(val === 'all' ? '' : val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          {LEVELS.map((lvl) => (
            <SelectItem key={lvl} value={lvl}>
              {lvl}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

---

### Task 8: Add Filtered Courses Action

**Files:**

- Modify: `app/actions/course.ts`

- [ ] **Step 1: Add getPublishedCoursesWithFilters**

Add at end of file:

```typescript
export async function getPublishedCoursesWithFilters(
  page = 0,
  limit = 9,
  category?: string,
  level?: string
) {
  const allCourses = await db.select().from(CourseList).where(eq(CourseList.publish, true));
  let filtered = allCourses;
  if (category) filtered = filtered.filter((c) => c.category === category);
  if (level) filtered = filtered.filter((c) => c.level === level);
  return filtered.slice(page * limit, (page + 1) * limit);
}
```

---

### Task 9: Update Explore Page with Filters

**Files:**

- Modify: `app/dashboard/explore/page.tsx`

- [ ] **Step 1: Add imports**

```tsx
import CourseFilters from '../_components/CourseFilters';
import { getPublishedCoursesWithFilters } from '@/app/actions/course';
```

- [ ] **Step 2: Add filter state**

```tsx
const [selectedCategory, setSelectedCategory] = useState('');
const [selectedLevel, setSelectedLevel] = useState('');
```

- [ ] **Step 3: Update GetAllCourse**

```tsx
const GetAllCourse = async () => {
  setIsSearching(true);
  try {
    const result = await getPublishedCoursesWithFilters(
      pageIndex,
      9,
      selectedCategory || undefined,
      selectedLevel || undefined
    );
    setCourseList(result || []);
    setSearchSource(null);
  } finally {
    setIsSearching(false);
  }
};
```

- [ ] **Step 4: Add filter useEffect dependency**

```tsx
useEffect(() => {
  if (debouncedQuery.trim()) {
    performSearch(debouncedQuery);
  } else {
    GetAllCourse();
  }
}, [pageIndex, debouncedQuery, selectedCategory, selectedLevel]);
```

- [ ] **Step 5: Add filter UI**

Before the course grid:

```tsx
{
  !searchQuery && (
    <CourseFilters
      selectedCategory={selectedCategory}
      onCategoryChange={(val) => {
        setSelectedCategory(val);
        setPageIndex(0);
      }}
      selectedLevel={selectedLevel}
      onLevelChange={(val) => {
        setSelectedLevel(val);
        setPageIndex(0);
      }}
    />
  );
}
```

---

### Task 10: Verify and Commit

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 2: Run lint**

Run: `npm run lint 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add publish, ratings, and explore filters"
```

---

## Summary

After this plan:

1. Users can **publish/unpublish** courses from the dashboard dropdown
2. Users can **rate and review** courses (1-5 stars + text)
3. Explore page has **category and level filters**
4. Public course page shows **average rating** and allows rating
5. Course cards show **star ratings**
