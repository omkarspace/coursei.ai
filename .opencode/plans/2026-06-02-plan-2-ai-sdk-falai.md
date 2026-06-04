# Plan 2: AI SDK Migration & Fal.ai Image Generation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate client-side AI generation to server-side Vercel AI SDK with Zod validation, and integrate Fal.ai for automatic course banner and chapter illustration generation.

**Architecture:** Replace `configs/AiModel.jsx` usage with `server/ai/generate.ts` functions via new server actions. Add Fal.ai banner generation to the course creation flow and chapter illustration generation to the Inngest background job.

**Tech Stack:** Next.js 15, Vercel AI SDK, Google Gemini, Fal.ai (Flux), Zod, Drizzle ORM

---

## File Structure

| Action | File                                                           | Purpose                                                     |
| ------ | -------------------------------------------------------------- | ----------------------------------------------------------- |
| Create | `app/actions/ai.ts`                                            | Server actions wrapping AI generation functions             |
| Modify | `app/_components/QuizGenerator.jsx`                            | Use server action instead of client-side AI                 |
| Modify | `app/_components/Flashcards.jsx`                               | Use server action instead of client-side AI                 |
| Modify | `app/_components/StudyNotes.jsx`                               | Use server action instead of client-side AI                 |
| Modify | `app/create-course/page.jsx`                                   | Use server action for course layout generation              |
| Modify | `server/ai/generate-course.ts`                                 | Add Fal.ai illustration generation per chapter              |
| Create | `app/create-course/_components/AiBannerButton.jsx`             | Button to generate banner with Fal.ai                       |
| Modify | `app/create-course/[courseId]/_components/CourseBasicInfo.jsx` | Add AI banner generation button                             |
| Modify | `configs/AiModel.jsx`                                          | Deprecate (keep for backward compat but mark as deprecated) |

---

### Task 1: Create AI Server Actions

**Files:**

- Create: `app/actions/ai.ts`

- [ ] **Step 1: Create AI server actions**

```typescript
'use server';

import { generateQuiz, generateFlashcards, generateStudyNotes } from '@/server/ai/generate';

export async function generateQuizAction(chapterName: string, contentSummary: string) {
  return generateQuiz(chapterName, contentSummary);
}

export async function generateFlashcardsAction(chapterName: string, contentSummary: string) {
  return generateFlashcards(chapterName, contentSummary);
}

export async function generateStudyNotesAction(chapterName: string, contentSummary: string) {
  return generateStudyNotes(chapterName, contentSummary);
}
```

---

### Task 2: Migrate QuizGenerator to Server Actions

**Files:**

- Modify: `app/_components/QuizGenerator.jsx`

- [ ] **Step 1: Replace client-side AI with server action**

Find the import of `GenerateQuiz_AI`:

```jsx
import { GenerateQuiz_AI } from '@/configs/AiModel';
```

Replace with:

```jsx
import { generateQuizAction } from '@/app/actions/ai';
```

Find the `generateQuiz` function body. Replace the AI call:

```jsx
// OLD:
const PROMPT = `Generate a quiz with 5 multiple choice questions...`;
const result = await GenerateQuiz_AI.sendMessage(PROMPT);
const response = JSON.parse(result.response.text());

// NEW:
const contentText = chapterContent?.content?.map((c) => c.explanation).join('\n') || chapterName;
const response = await generateQuizAction(chapterName, contentText.substring(0, 2000));
```

Remove the PROMPT variable and the old `GenerateQuiz_AI.sendMessage` call.

---

### Task 3: Migrate Flashcards to Server Actions

**Files:**

- Modify: `app/_components/Flashcards.jsx`

- [ ] **Step 1: Replace client-side AI with server action**

Find the import of `GenerateFlashcards_AI`:

```jsx
import { GenerateFlashcards_AI } from '@/configs/AiModel';
```

Replace with:

```jsx
import { generateFlashcardsAction } from '@/app/actions/ai';
```

Find the `generateFlashcards` function body. Replace the AI call:

```jsx
// OLD:
const PROMPT = `Generate 10 flashcards...`;
const result = await GenerateFlashcards_AI.sendMessage(PROMPT);
const response = JSON.parse(result.response.text());

// NEW:
const contentText = chapterContent?.content?.map((c) => c.explanation).join('\n') || chapterName;
const response = await generateFlashcardsAction(chapterName, contentText.substring(0, 2000));
```

---

### Task 4: Migrate StudyNotes to Server Actions

**Files:**

- Modify: `app/_components/StudyNotes.jsx`

- [ ] **Step 1: Replace client-side AI with server action**

Find the import of `GenerateStudyNotes_AI`:

```jsx
import { GenerateStudyNotes_AI } from '@/configs/AiModel';
```

Replace with:

```jsx
import { generateStudyNotesAction } from '@/app/actions/ai';
```

Find the `generateStudyNotes` function body. Replace the AI call:

```jsx
// OLD:
const PROMPT = `Generate concise study notes...`;
const result = await GenerateStudyNotes_AI.sendMessage(PROMPT);
const response = JSON.parse(result.response.text());

// NEW:
const contentText = chapterContent?.content?.map((c) => c.explanation).join('\n') || chapterName;
const response = await generateStudyNotesAction(chapterName, contentText.substring(0, 2000));
```

---

### Task 5: Migrate Course Layout Generation to Server Action

**Files:**

- Modify: `app/actions/ai.ts` (add to existing)

- [ ] **Step 1: Add course layout generation action**

Add to `app/actions/ai.ts`:

```typescript
import { generateCourseLayout } from '@/server/ai/generate';

export async function generateCourseLayoutAction(
  category: string,
  topic: string,
  level: string,
  duration: string,
  numChapters: number
) {
  return generateCourseLayout(category, topic, level, duration, numChapters);
}
```

**Files:**

- Modify: `app/create-course/page.jsx`

- [ ] **Step 2: Replace client-side AI in create-course**

Find the import of `GenerateCourseLayout_AI`:

```jsx
import { GenerateCourseLayout_AI } from '@/configs/AiModel';
```

Replace with:

```jsx
import { generateCourseLayoutAction } from '@/app/actions/ai';
```

Find where `GenerateCourseLayout_AI` is called and replace:

```jsx
// OLD:
const result = await GenerateCourseLayout_AI.sendMessage(PROMPT);
const AiGeneratedResult = JSON.parse(result.response.text());

// NEW:
const AiGeneratedResult = await generateCourseLayoutAction(
  userCourseInput?.selectedCategory,
  userCourseInput?.topic,
  userCourseInput?.level,
  userCourseInput?.duration,
  userCourseInput?.noOfChapters || 5
);
```

---

### Task 6: Create Fal.ai Banner Generation Button

**Files:**

- Create: `app/create-course/_components/AiBannerButton.jsx`

- [ ] **Step 1: Create AiBannerButton component**

```jsx
'use client';
import React, { useState } from 'react';
import { generateCourseBanner } from '@/server/services/fal';
import { updateCourseBanner } from '@/app/actions/course';
import { toast } from 'sonner';
import { HiOutlineSparkles } from 'react-icons/hi2';

export default function AiBannerButton({ courseId, courseName, category, onBannerGenerated }) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!process.env.NEXT_PUBLIC_FAL_KEY) {
      toast.error('Fal.ai not configured. Add FAL_KEY to environment.');
      return;
    }
    setGenerating(true);
    try {
      const bannerUrl = await generateCourseBanner({ courseName, category, style: 'modern' });
      if (bannerUrl) {
        await updateCourseBanner(courseId, bannerUrl);
        toast.success('AI banner generated!');
        onBannerGenerated?.(bannerUrl);
      } else {
        toast.error('Failed to generate banner');
      }
    } catch (error) {
      console.error('Banner generation error:', error);
      toast.error('Failed to generate banner');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={generating}
      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
    >
      <HiOutlineSparkles className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
      {generating ? 'Generating...' : 'Generate AI Banner'}
    </button>
  );
}
```

---

### Task 7: Integrate AI Banner Button into CourseBasicInfo

**Files:**

- Modify: `app/create-course/[courseId]/_components/CourseBasicInfo.jsx`

- [ ] **Step 1: Add AiBannerButton import and usage**

Add import:

```jsx
import AiBannerButton from './AiBannerButton';
```

Add the button below the banner image upload area, passing the course data:

```jsx
<AiBannerButton
  courseId={course.courseId}
  courseName={course?.courseOutput?.course?.name}
  category={course.category}
  onBannerGenerated={(url) => refreshData()}
/>
```

---

### Task 8: Add Fal.ai Illustration to Inngest Course Generation

**Files:**

- Modify: `server/ai/generate-course.ts`

- [ ] **Step 1: Import Fal.ai illustration function**

Add import:

```typescript
import { generateChapterIllustration } from '@/server/services/fal';
```

- [ ] **Step 2: Generate illustration after chapter content**

After the chapter content is generated and saved (inside the chapter loop), add:

```typescript
// Generate chapter illustration (non-blocking, fail silently)
try {
  const illustrationUrl = await generateChapterIllustration(chapter.name, topic);
  if (illustrationUrl) {
    // Store illustration URL in chapter content
    // You could add an illustrations field to the schema or store in content JSON
    console.log(`Generated illustration for chapter ${chapter.name}`);
  }
} catch (error) {
  console.error(`Failed to generate illustration for chapter ${chapter.name}:`, error);
}
```

---

### Task 9: Verify and Commit

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 2: Lint check**

Run: `npm run lint 2>&1 | tail -20`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: migrate AI to server SDK, add Fal.ai banner generation"
```

---

## Summary

After this plan:

1. Quiz, Flashcards, Study Notes generation uses **server-side AI SDK** with Zod validation
2. Course layout generation uses **server-side AI SDK**
3. Users can generate **AI course banners** with Fal.ai
4. Chapter illustrations are **auto-generated** during course creation
5. Client-side `configs/AiModel.jsx` is no longer used for generation
