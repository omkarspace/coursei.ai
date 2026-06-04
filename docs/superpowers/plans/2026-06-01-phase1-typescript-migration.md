# Phase 1: TypeScript Migration & Foundation Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Coursei.ai from JavaScript to TypeScript, restructure the database schema with proper relations and new tables, consolidate duplicate DB connections, add Inngest for background job processing, and implement a storage abstraction layer.

**Architecture:** The existing flat `configs/` directory will be reorganized into a modular `server/` directory structure. The schema will be enhanced with foreign keys, timestamps, and two new tables (`user_progress`, `course_ratings`). Inngest will handle long-running course generation jobs with a database-driven status polling UI. A storage adapter pattern will support Cloudinary, local filesystem, and S3-compatible storage.

**Tech Stack:** TypeScript, Drizzle ORM, Inngest, Upstash Redis, Neon PostgreSQL

---

## File Structure

```
server/
├── db/
│   ├── schema.ts           # Drizzle schema with relations + new tables
│   └── index.ts            # Consolidated DB connection
├── ai/
│   └── prompts.ts          # AI prompts extracted from AiModel.jsx
├── services/
│   ├── storage.ts          # Cloudinary/Local/S3 adapter
│   ├── youtube.ts          # YouTube API
│   ├── inngest.ts          # Inngest client + functions
│   └── cache.ts            # Upstash Redis caching
└── types/
    └── index.ts            # Shared TypeScript types
```

---

## Task 1: Install TypeScript Dependencies

**Files:**

- Modify: `package.json`
- Create: `tsconfig.json`

- [ ] **Step 1: Install TypeScript and type definitions**

Run:

```bash
npm install -D typescript @types/node @types/react @types/react-dom
```

- [ ] **Step 2: Create tsconfig.json**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json tsconfig.json
git commit -m "chore: install TypeScript and create tsconfig.json"
```

---

## Task 2: Create Server Directory Structure

**Files:**

- Create: `server/db/schema.ts`
- Create: `server/db/index.ts`
- Create: `server/ai/prompts.ts`
- Create: `server/services/youtube.ts`
- Create: `server/services/storage.ts`
- Create: `server/services/inngest.ts`
- Create: `server/services/cache.ts`
- Create: `server/types/index.ts`

- [ ] **Step 1: Create directory structure**

Run:

```bash
mkdir -p server/db server/ai server/services server/types
```

- [ ] **Step 2: Commit**

```bash
git add server/
git commit -m "chore: create server directory structure"
```

---

## Task 3: Migrate Schema with TypeScript + Relations

**Files:**

- Create: `server/db/schema.ts`
- Modify: `drizzle.config.js` (update schema path)

- [ ] **Step 1: Create server/db/schema.ts with all tables**

Create `server/db/schema.ts`:

```typescript
import {
  boolean,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===== Course Output Types =====
export interface Chapter {
  name: string;
  about: string;
  duration: string;
}

export interface CourseOutput {
  course: {
    name: string;
    description: string;
    noOfChapters: number;
    duration: string;
    chapters: Chapter[];
  };
}

export interface ChapterContent {
  title: string;
  explanation: string;
  code: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface StudyNotes {
  summary: string;
  keyPoints: string[];
  importantTerms: { term: string; definition: string }[];
}

// ===== Course Generation Status =====
export type CourseStatus =
  | 'draft'
  | 'generating_outline'
  | 'generating_chapters'
  | 'complete'
  | 'failed';

// ===== Tables =====

export const CourseList = pgTable('CourseList', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull().unique(),
  name: varchar('name').notNull(),
  category: varchar('category').notNull(),
  level: varchar('level').notNull(),
  includeVideo: varchar('includeVideo').notNull().default('Yes'),
  courseOutput: json('courseOutput').notNull().$type<CourseOutput>(),
  createdBy: varchar('createdBy').notNull(),
  userName: varchar('username'),
  userProfileImage: varchar('userProfileImage'),
  courseBanner: varchar('courseBanner').default('/placeholderr.png'),
  publish: boolean('publish').default(false),
  status: varchar('status').$type<CourseStatus>().notNull().default('draft'),
  progress: integer('progress').notNull().default(0),
  currentStep: varchar('currentStep'),
  generationError: text('generationError'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const Chapters = pgTable('chapters', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull(),
  chapterId: integer('chapterId').notNull(),
  content: json('content').notNull().$type<ChapterContent[]>(),
  videoId: varchar('videoId').notNull().default(''),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const Quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull(),
  chapterId: integer('chapterId').notNull(),
  questions: json('questions').notNull().$type<QuizQuestion[]>(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const Flashcards = pgTable('flashcards', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull(),
  chapterId: integer('chapterId').notNull(),
  cards: json('cards').notNull().$type<Flashcard[]>(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const StudyNotesTable = pgTable('study_notes', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull(),
  chapterId: integer('chapterId').notNull(),
  notes: json('notes').notNull().$type<StudyNotes>(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const UserProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: varchar('userId').notNull(),
  courseId: varchar('courseId').notNull(),
  chapterId: integer('chapterId').notNull(),
  completed: boolean('completed').notNull().default(false),
  lastAccessedAt: timestamp('lastAccessedAt').defaultNow().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const CourseRatings = pgTable('course_ratings', {
  id: serial('id').primaryKey(),
  courseId: varchar('courseId').notNull(),
  userId: varchar('userId').notNull(),
  rating: integer('rating').notNull(),
  review: text('review'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

// ===== Relations =====

export const courseListRelations = relations(CourseList, ({ many }) => ({
  chapters: many(Chapters),
  quizzes: many(Quizzes),
  flashcards: many(Flashcards),
  studyNotes: many(StudyNotesTable),
  progress: many(UserProgress),
  ratings: many(CourseRatings),
}));

export const chaptersRelations = relations(Chapters, ({ one }) => ({
  course: one(CourseList, {
    fields: [Chapters.courseId],
    references: [CourseList.courseId],
  }),
}));

export const quizzesRelations = relations(Quizzes, ({ one }) => ({
  course: one(CourseList, {
    fields: [Quizzes.courseId],
    references: [CourseList.courseId],
  }),
}));

export const flashcardsRelations = relations(Flashcards, ({ one }) => ({
  course: one(CourseList, {
    fields: [Flashcards.courseId],
    references: [CourseList.courseId],
  }),
}));

export const studyNotesRelations = relations(StudyNotesTable, ({ one }) => ({
  course: one(CourseList, {
    fields: [StudyNotesTable.courseId],
    references: [CourseList.courseId],
  }),
}));

export const userProgressRelations = relations(UserProgress, ({ one }) => ({
  course: one(CourseList, {
    fields: [UserProgress.courseId],
    references: [CourseList.courseId],
  }),
}));

export const courseRatingsRelations = relations(CourseRatings, ({ one }) => ({
  course: one(CourseList, {
    fields: [CourseRatings.courseId],
    references: [CourseList.courseId],
  }),
}));
```

- [ ] **Step 2: Update drizzle.config.js**

Modify `drizzle.config.js`:

```javascript
import dotenv from 'dotenv';
dotenv.config();

/** @type {import("drizzle-kit").Config} */
export default {
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add server/db/schema.ts drizzle.config.js
git commit -m "feat: migrate schema to TypeScript with relations and new tables"
```

---

## Task 4: Consolidate Database Connection

**Files:**

- Create: `server/db/index.ts`
- Delete: `configs/db.jsx`
- Delete: `lib/db.js`

- [ ] **Step 1: Create consolidated server/db/index.ts**

Create `server/db/index.ts`:

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle({ client: sql, schema });
```

- [ ] **Step 2: Delete old database connection files**

Run:

```bash
rm configs/db.jsx lib/db.js
```

- [ ] **Step 3: Update all imports to use new path**

Files to update:

- `app/actions/course.js` → change `@/lib/db` to `@/server/db`

Update `app/actions/course.js` line 3:

```typescript
import { db } from '@/server/db';
```

- [ ] **Step 4: Commit**

```bash
git add server/db/index.ts app/actions/course.js
git rm configs/db.jsx lib/db.js
git commit -m "refactor: consolidate DB connections to server/db/index.ts"
```

---

## Task 5: Update Server Actions with New Schema

**Files:**

- Modify: `app/actions/course.js` → rename to `app/actions/course.ts`

- [ ] **Step 1: Rename and update server actions**

Rename `app/actions/course.js` to `app/actions/course.ts` and update imports:

```typescript
'use server';

import { db } from '@/server/db';
import {
  CourseList,
  Chapters,
  Quizzes,
  Flashcards,
  StudyNotesTable,
  UserProgress,
} from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

async function getUserEmail(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const user = await (await clerkClient()).users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error('No email found');
  return email;
}

export async function getUserCourses() {
  const email = await getUserEmail();
  const courses = await db.select().from(CourseList).where(eq(CourseList.createdBy, email));
  return courses;
}

export async function getCourseById(courseId: string) {
  const email = await getUserEmail();
  const courses = await db
    .select()
    .from(CourseList)
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));
  return courses[0] || null;
}

export async function getPublishedCourseById(courseId: string) {
  const courses = await db.select().from(CourseList).where(eq(CourseList.courseId, courseId));
  return courses[0] || null;
}

export async function getAllPublishedCourses(page = 0, limit = 9) {
  const courses = await db
    .select()
    .from(CourseList)
    .limit(limit)
    .offset(page * limit);
  return courses;
}

export async function createCourse(courseData: {
  courseId: string;
  name: string;
  category: string;
  level: string;
  includeVideo: string;
  courseOutput: any;
}) {
  const email = await getUserEmail();
  const user = await (await clerkClient()).users.getUser((await auth()).userId!);

  const result = await db
    .insert(CourseList)
    .values({
      ...courseData,
      createdBy: email,
      userName: user.fullName,
      userProfileImage: user.imageUrl,
    })
    .returning({ id: CourseList.id, courseId: CourseList.courseId });

  revalidatePath('/dashboard');
  return result[0];
}

export async function updateCourse(
  courseId: string,
  updates: Partial<typeof CourseList.$inferInsert>
) {
  const email = await getUserEmail();
  const result = await db
    .update(CourseList)
    .set(updates)
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)))
    .returning({ id: CourseList.id });

  revalidatePath('/dashboard');
  revalidatePath(`/course/${courseId}`);
  return result[0];
}

export async function updateCourseStatus(
  courseId: string,
  status: 'draft' | 'generating_outline' | 'generating_chapters' | 'complete' | 'failed',
  progress: number,
  currentStep?: string,
  error?: string
) {
  await db
    .update(CourseList)
    .set({
      status,
      progress,
      currentStep,
      generationError: error,
    })
    .where(eq(CourseList.courseId, courseId));
}

export async function updateCourseBanner(courseId: string, bannerUrl: string) {
  const email = await getUserEmail();
  await db
    .update(CourseList)
    .set({ courseBanner: bannerUrl })
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));

  revalidatePath(`/course/${courseId}`);
}

export async function deleteCourse(courseId: string) {
  const email = await getUserEmail();
  const result = await db
    .delete(CourseList)
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)))
    .returning({ id: CourseList.id });

  revalidatePath('/dashboard');
  return result[0];
}

export async function publishCourse(courseId: string) {
  const email = await getUserEmail();
  await db
    .update(CourseList)
    .set({ publish: true })
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));

  revalidatePath('/dashboard');
  revalidatePath('/explore');
  revalidatePath(`/course/${courseId}`);
}

export async function getCourseChapters(courseId: string) {
  const chapters = await db
    .select()
    .from(Chapters)
    .where(eq(Chapters.courseId, courseId))
    .orderBy(Chapters.chapterId);
  return chapters;
}

export async function createChapter(chapterData: {
  courseId: string;
  chapterId: number;
  content: any;
  videoId?: string;
}) {
  await getUserEmail();
  await db.insert(Chapters).values(chapterData);
  revalidatePath(`/course/${chapterData.courseId}/start`);
}

export async function updateCourseNameAndDescription(
  courseId: string,
  name: string,
  description: string
) {
  const email = await getUserEmail();
  const courses = await db
    .select()
    .from(CourseList)
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));

  if (!courses[0]) throw new Error('Course not found');

  const courseOutput = courses[0].courseOutput as any;
  courseOutput.course.name = name;
  courseOutput.course.description = description;

  await db
    .update(CourseList)
    .set({ courseOutput })
    .where(and(eq(CourseList.courseId, courseId), eq(CourseList.createdBy, email)));

  revalidatePath(`/course/${courseId}`);
  revalidatePath('/dashboard');
}

export async function getQuiz(courseId: string, chapterId: number) {
  await getUserEmail();
  const result = await db
    .select()
    .from(Quizzes)
    .where(and(eq(Quizzes.courseId, courseId), eq(Quizzes.chapterId, chapterId)));
  return result[0] || null;
}

export async function saveQuiz(courseId: string, chapterId: number, questions: any[]) {
  await getUserEmail();
  const existing = await getQuiz(courseId, chapterId);
  if (existing) {
    await db.update(Quizzes).set({ questions }).where(eq(Quizzes.id, existing.id));
  } else {
    await db.insert(Quizzes).values({ courseId, chapterId, questions });
  }
  revalidatePath(`/course/${courseId}/start`);
}

export async function getFlashcards(courseId: string, chapterId: number) {
  await getUserEmail();
  const result = await db
    .select()
    .from(Flashcards)
    .where(and(eq(Flashcards.courseId, courseId), eq(Flashcards.chapterId, chapterId)));
  return result[0] || null;
}

export async function saveFlashcards(courseId: string, chapterId: number, cards: any[]) {
  await getUserEmail();
  const existing = await getFlashcards(courseId, chapterId);
  if (existing) {
    await db.update(Flashcards).set({ cards }).where(eq(Flashcards.id, existing.id));
  } else {
    await db.insert(Flashcards).values({ courseId, chapterId, cards });
  }
  revalidatePath(`/course/${courseId}/start`);
}

export async function getStudyNotes(courseId: string, chapterId: number) {
  await getUserEmail();
  const result = await db
    .select()
    .from(StudyNotesTable)
    .where(and(eq(StudyNotesTable.courseId, courseId), eq(StudyNotesTable.chapterId, chapterId)));
  return result[0] || null;
}

export async function saveStudyNotes(courseId: string, chapterId: number, notes: any) {
  await getUserEmail();
  const existing = await getStudyNotes(courseId, chapterId);
  if (existing) {
    await db.update(StudyNotesTable).set({ notes }).where(eq(StudyNotesTable.id, existing.id));
  } else {
    await db.insert(StudyNotesTable).values({ courseId, chapterId, notes });
  }
  revalidatePath(`/course/${courseId}/start`);
}

export async function getUserProgress(courseId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const progress = await db
    .select()
    .from(UserProgress)
    .where(and(eq(UserProgress.courseId, courseId), eq(UserProgress.userId, userId)));
  return progress;
}

export async function markChapterComplete(courseId: string, chapterId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const existing = await db
    .select()
    .from(UserProgress)
    .where(
      and(
        eq(UserProgress.courseId, courseId),
        eq(UserProgress.userId, userId),
        eq(UserProgress.chapterId, chapterId)
      )
    );

  if (existing[0]) {
    await db
      .update(UserProgress)
      .set({ completed: true, lastAccessedAt: new Date() })
      .where(eq(UserProgress.id, existing[0].id));
  } else {
    await db.insert(UserProgress).values({
      userId,
      courseId,
      chapterId,
      completed: true,
    });
  }
}
```

- [ ] **Step 2: Find and update all files importing from @/configs/schema**

Run:

```bash
grep -r "@/configs/schema" app/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
```

Update each file to import from `@/server/db/schema` instead.

- [ ] **Step 3: Commit**

```bash
git add app/actions/course.ts
git commit -m "feat: update server actions with TypeScript types and new progress functions"
```

---

## Task 6: Migrate YouTube Service

**Files:**

- Create: `server/services/youtube.ts`
- Delete: `configs/service.jsx`

- [ ] **Step 1: Create server/services/youtube.ts**

Create `server/services/youtube.ts`:

```typescript
import axios from 'axios';

const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: { default: { url: string } };
  };
}

export async function getVideos(query: string): Promise<YouTubeVideo[]> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey) {
    return [];
  }

  const params = {
    part: 'snippet',
    q: query,
    maxResults: 1,
    type: 'video',
    key: apiKey,
  };

  try {
    const resp = await axios.get(`${YOUTUBE_BASE_URL}/search`, { params });
    return resp.data.items || [];
  } catch (error) {
    console.error('YouTube API error:', error);
    return [];
  }
}
```

- [ ] **Step 2: Delete old service file**

Run:

```bash
rm configs/service.jsx
```

- [ ] **Step 3: Update all imports**

Files that import from `@/configs/service`:

- Search and update all references to use `@/server/services/youtube`

- [ ] **Step 4: Commit**

```bash
git add server/services/youtube.ts
git rm configs/service.jsx
git commit -m "refactor: migrate YouTube service to TypeScript"
```

---

## Task 7: Create Storage Abstraction Layer

**Files:**

- Create: `server/services/storage.ts`
- Delete: `configs/cloudinary.js`

- [ ] **Step 1: Create storage adapter interface and implementations**

Create `server/services/storage.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';

// ===== Storage Adapter Interface =====
export interface StorageAdapter {
  upload(file: Buffer, path: string, contentType?: string): Promise<string>;
  delete(path: string): Promise<void>;
  getPublicUrl(path: string): string;
}

// ===== Cloudinary Implementation =====
class CloudinaryStorage implements StorageAdapter {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async upload(file: Buffer, path: string, contentType?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            public_id: path,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result?.secure_url || '');
          }
        )
        .end(file);
    });
  }

  async delete(path: string): Promise<void> {
    await cloudinary.uploader.destroy(path);
  }

  getPublicUrl(path: string): string {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${path}`;
  }
}

// ===== Local Filesystem Implementation =====
class LocalStorage implements StorageAdapter {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.LOCAL_STORAGE_DIR || './public/uploads';
  }

  async upload(file: Buffer, path: string, contentType?: string): Promise<string> {
    const fs = await import('fs/promises');
    const filePath = `${this.uploadDir}/${path}`;
    await fs.mkdir(`${this.uploadDir}/${path.dirname(path)}`, { recursive: true });
    await fs.writeFile(filePath, file);
    return `/uploads/${path}`;
  }

  async delete(path: string): Promise<void> {
    const fs = await import('fs/promises');
    await fs.unlink(`${this.uploadDir}/${path}`);
  }

  getPublicUrl(path: string): string {
    return `/uploads/${path}`;
  }
}

// ===== Factory Function =====
export function getStorage(): StorageAdapter {
  const provider = process.env.STORAGE_PROVIDER || 'local';

  switch (provider) {
    case 'cloudinary':
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        console.warn('Missing Cloudinary env vars, falling back to local storage');
        return new LocalStorage();
      }
      return new CloudinaryStorage();
    case 'local':
    default:
      return new LocalStorage();
  }
}

// ===== Convenience Export =====
export const storage = getStorage();
```

- [ ] **Step 2: Delete old cloudinary config**

Run:

```bash
rm configs/cloudinary.js
```

- [ ] **Step 3: Commit**

```bash
git add server/services/storage.ts
git rm configs/cloudinary.js
git commit -m "feat: add storage abstraction layer with Cloudinary and local support"
```

---

## Task 8: Create Inngest Client

**Files:**

- Create: `server/services/inngest.ts`

- [ ] **Step 1: Install Inngest**

Run:

```bash
npm install inngest
```

- [ ] **Step 2: Create Inngest client**

Create `server/services/inngest.ts`:

```typescript
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'coursei-ai',
  name: 'Coursei.ai',
});
```

- [ ] **Step 3: Create course generation function**

Create `server/ai/generate-course.ts`:

```typescript
import { inngest } from '@/server/services/inngest';
import { db } from '@/server/db';
import { CourseList, Chapters } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

export const generateCourse = inngest.createFunction(
  { id: 'generate-course' },
  { event: 'course.generate' },
  async ({ event, step }) => {
    const { courseId, topic, chapters } = event.data;

    // Step 1: Update status to generating
    await step.run('update-status-generating', () =>
      db
        .update(CourseList)
        .set({ status: 'generating_chapters', progress: 10, currentStep: 'Starting generation...' })
        .where(eq(CourseList.courseId, courseId))
    );

    // Step 2: Generate content for each chapter
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const progress = Math.round(10 + (i / chapters.length) * 80);

      await step.run(`generate-chapter-${i}`, async () => {
        // Update progress
        await db
          .update(CourseList)
          .set({
            progress,
            currentStep: `Generating chapter ${i + 1} of ${chapters.length}: ${chapter.name}`,
          })
          .where(eq(CourseList.courseId, courseId));

        // TODO: Call AI model to generate chapter content
        // const content = await generateChapterContent(topic, chapter.name);

        // Save chapter
        await db.insert(Chapters).values({
          courseId,
          chapterId: i,
          content: [], // Will be populated by AI
          videoId: '',
        });
      });
    }

    // Step 3: Mark as complete
    await step.run('update-status-complete', () =>
      db
        .update(CourseList)
        .set({ status: 'complete', progress: 100, currentStep: 'Complete' })
        .where(eq(CourseList.courseId, courseId))
    );

    return { courseId, status: 'complete' };
  }
);
```

- [ ] **Step 4: Create Inngest API route**

Create `app/api/inngest/route.ts`:

```typescript
import { serve } from 'inngest/next';
import { inngest } from '@/server/services/inngest';
import { generateCourse } from '@/server/ai/generate-course';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateCourse],
});
```

- [ ] **Step 5: Commit**

```bash
git add server/services/inngest.ts server/ai/generate-course.ts app/api/inngest/route.ts package.json package-lock.json
git commit -m "feat: add Inngest for background course generation"
```

---

## Task 9: Create Upstash Cache Service

**Files:**

- Create: `server/services/cache.ts`

- [ ] **Step 1: Install Upstash Redis**

Run:

```bash
npm install @upstash/redis
```

- [ ] **Step 2: Create cache service**

Create `server/services/cache.ts`:

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const DEFAULT_TTL = 3600; // 1 hour

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

export async function setCached<T>(key: string, data: T, ttl = DEFAULT_TTL): Promise<void> {
  try {
    await redis.set(key, data, { ex: ttl });
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

export async function getCachedCourse(courseId: string) {
  return getCached(`course:${courseId}`);
}

export async function setCachedCourse(courseId: string, data: any) {
  await setCached(`course:${courseId}`, data);
}

export async function invalidateCourseCache(courseId: string) {
  await invalidateCache(`course:${courseId}*`);
}
```

- [ ] **Step 3: Commit**

```bash
git add server/services/cache.ts package.json package-lock.json
git commit -m "feat: add Upstash Redis caching layer"
```

---

## Task 10: Update Environment Variables

**Files:**

- Modify: `.env.example`

- [ ] **Step 1: Update .env.example with new variables**

Modify `.env.example`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=

# Neon PostgreSQL Database (server-only, no NEXT_PUBLIC_ prefix)
DATABASE_URL=

# App URL
NEXT_PUBLIC_HOST_NAME=http://localhost:3000

# Optional: YouTube API Key (for video search)
# NEXT_PUBLIC_YOUTUBE_API_KEY=

# ===== STORAGE =====
# Options: local | cloudinary
STORAGE_PROVIDER=local

# Cloudinary (if using cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Local storage directory (if using local)
# LOCAL_STORAGE_DIR=./public/uploads

# ===== BACKGROUND JOBS (Inngest) =====
# Get keys at https://inngest.com
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# ===== CACHING (Upstash Redis) =====
# Get keys at https://upstash.com
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: update .env.example with new environment variables"
```

---

## Task 11: Run Database Migration

**Files:**

- Modify: `drizzle/` (migration files)

- [ ] **Step 1: Generate and push schema changes**

Run:

```bash
npm run db:push
```

This will create the new tables (`user_progress`, `course_ratings`) and add the new columns (`status`, `progress`, `currentStep`, `generationError`, `createdAt`, `updatedAt`) to existing tables.

- [ ] **Step 2: Verify migration**

Run:

```bash
npm run db:studio
```

Verify that all tables exist and have the correct columns.

- [ ] **Step 3: Commit migration files**

```bash
git add drizzle/
git commit -m "chore: database migration for Phase 1 schema changes"
```

---

## Task 12: Verify Build

- [ ] **Step 1: Run TypeScript compiler**

Run:

```bash
npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 2: Run Next.js build**

Run:

```bash
npm run build
```

Ensure the build succeeds.

- [ ] **Step 3: Commit any fixes**

```bash
git add .
git commit -m "fix: resolve TypeScript and build errors"
```

---

## Summary

After completing all tasks, you will have:

1. **TypeScript migration** - All core files migrated with type safety
2. **Modular server structure** - `server/` directory with `db/`, `ai/`, `services/`, `types/`
3. **Enhanced schema** - Foreign keys, timestamps, new tables (`user_progress`, `course_ratings`)
4. **Consolidated DB connection** - Single `server/db/index.ts` replacing duplicates
5. **Inngest integration** - Background job processing for course generation
6. **Storage abstraction** - Factory pattern supporting Cloudinary and local storage
7. **Upstash Redis caching** - Cache layer for course data
8. **Progress tracking** - New columns and functions for generation status
9. **Updated server actions** - TypeScript types, new progress functions
10. **Updated environment variables** - Complete `.env.example` with all new services
