# RAG Chat with Course Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a streaming AI tutor that can answer questions about a specific course, grounded in that course's chapter content. Accessible as a 6th tab ("Chat") in the chapter workspace, and as a standalone `/course/[courseId]/chat` page.

**Architecture:** Server-side: a new API route `POST /api/course/[courseId]/chat` loads all chapters + their content + all quizzes + all flashcards for the course, then calls `streamText()` from the Vercel AI SDK with a system prompt grounded in the course. No embedding/RAG — the full course fits in Gemini Flash's 1M-token context. Client-side: `useChat` from `ai/react` posts to the route, renders the streaming response. Citations come from naming chapters directly in the system prompt.

**Tech Stack:** Vercel AI SDK (`streamText`, `useChat`), `@ai-sdk/google`, Next.js 15 route handler, React.

---

## File Structure

| Path | Role | New / Modified |
|---|---|---|
| `app/api/course/[courseId]/chat/route.ts` | Streaming POST endpoint | New |
| `app/_components/CourseChat.jsx` | Client chat UI with `useChat` | New |
| `app/course/[courseId]/start/_components/CourseStartClient.jsx` | Add "Chat" tab | Modified |
| `app/course/[courseId]/chat/page.jsx` | Standalone full-page chat | New |
| `__tests__/api/chat.test.ts` | Smoke test for the route handler | New |

---

### Task 1: Streaming chat API route

**Files:**
- Create: `app/api/course/[courseId]/chat/route.ts`

- [ ] **Step 1: Create the route handler**

```ts
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { Chapters, CourseList, Flashcards, Quizzes, StudyNotesTable } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { streamText, type UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { getModel } from '@/server/ai/models';

export const maxDuration = 30;

interface RouteContext {
  params: Promise<{ courseId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const { courseId } = await params;
  const { messages }: { messages: UIMessage[] } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages required', { status: 400 });
  }

  // Load course metadata
  const courseRows = await db.select().from(CourseList).where(eq(CourseList.courseId, courseId));
  const course = courseRows[0];
  if (!course) return new Response('Course not found', { status: 404 });

  // Load all chapters with their content
  const chapterRows = await db.select().from(Chapters).where(eq(Chapters.courseId, courseId));
  const chapterRowsSorted = chapterRows.sort((a, b) => a.chapterId - b.chapterId);

  // Load supporting material (optional but improves answers)
  const quizRows = await db.select().from(Quizzes).where(eq(Quizzes.courseId, courseId));
  const flashcardRows = await db.select().from(Flashcards).where(eq(Flashcards.courseId, courseId));
  const noteRows = await db.select().from(StudyNotesTable).where(eq(StudyNotesTable.courseId, courseId));

  // Build the system prompt grounding the model in the actual course content
  const chapterText = chapterRowsSorted
    .map(
      (ch, idx) =>
        `### Chapter ${idx + 1}: ${ch.content.map((c) => c.title).join(', ')}\n` +
        ch.content.map((c) => `${c.title}\n${c.explanation}`).join('\n\n')
    )
    .join('\n\n---\n\n');

  const quizText = quizRows
    .map((q) => `Quiz for chapter ${q.chapterId + 1}: ${q.questions.length} questions`)
    .join('\n');

  const flashcardText = flashcardRows
    .map(
      (f) =>
        `Flashcards for chapter ${f.chapterId + 1}: ${f.cards.length} cards (${f.cards
          .slice(0, 5)
          .map((c) => c.front)
          .join('; ')}…)`
    )
    .join('\n');

  const system = `You are a friendly, expert tutor for the course "${course.name}".
Course description: ${(course.courseOutput as any)?.course?.description ?? ''}

Your job: answer the student's questions using ONLY the course material below. Be concise, give examples from the content, and reference chapters by name when relevant (e.g. "In chapter 3, you'll see…").

If a question is outside the course scope, say so and suggest what to study instead. Do not invent facts.

===== COURSE CONTENT =====
${chapterText}
===== END COURSE CONTENT =====

This course has:
- ${quizText || 'no quizzes yet'}
- ${flashcardText || 'no flashcards yet'}
`;

  // streamText uses the model factory so it respects AI_PROVIDER env var
  const result = streamText({
    model: getModel('gemini-1.5-flash'),
    system,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.parts
        ?.filter((p) => p.type === 'text')
        .map((p) => (p as any).text)
        .join('\n') ?? '',
    })) as any,
  });

  return result.toUIMessageStreamResponse();
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/course/[courseId]/chat/route.ts
git commit -m "feat(chat): add streaming RAG chat route grounded in course content"
```

---

### Task 2: Client chat component

**Files:**
- Create: `app/_components/CourseChat.jsx`

- [ ] **Step 1: Create the client component**

```jsx
'use client';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HiPaperAirplane } from 'react-icons/hi2';
import { useEffect, useRef } from 'react';

export default function CourseChat({ courseId, courseName }) {
  const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
    api: `/api/course/${courseId}/chat`,
  });

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[600px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-2">
        {messages.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Ask anything about <span className="font-medium">{courseName}</span>. Try "Explain
              chapter 2 in simpler terms" or "Quiz me on what I've learned so far".
            </CardContent>
          </Card>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {m.parts
                ?.filter((p) => p.type === 'text')
                .map((p, i) => (
                  <span key={i} className="whitespace-pre-wrap">
                    {(p as any).text}
                  </span>
                ))}
            </div>
          </div>
        ))}
        {status === 'submitted' && (
          <div className="text-xs text-muted-foreground px-2">Thinking…</div>
        )}
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 p-2">
            Failed to get a response. Please try again.
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about this course…"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          disabled={status !== 'ready'}
        />
        <Button type="submit" disabled={status !== 'ready' || !input.trim()}>
          <HiPaperAirplane className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_components/CourseChat.jsx
git commit -m "feat(chat): add CourseChat client component with useChat"
```

---

### Task 3: Add Chat tab to the course workspace

**Files:**
- Modify: `app/course/[courseId]/start/_components/CourseStartClient.jsx`

- [ ] **Step 1: Read the file to find the `tabs` array and the `next/dynamic` imports**

- [ ] **Step 2: Add the import and tab entry**

At the top, after the other dynamic imports, add:

```jsx
import CourseChat from '@/app/_components/CourseChat';
```

Find the `tabs` array (around line 97-103 based on the exploration). Add a new entry — adapt the surrounding shape exactly:

```jsx
{ id: 'chat', label: 'Chat', icon: <HiOutlineChatBubbleLeftRight /> },
```

(Use whatever icon import pattern is already in the file — likely from `react-icons/hi2`. If `HiOutlineChatBubbleLeftRight` is not already imported, add it to the existing import line.)

- [ ] **Step 3: Render `CourseChat` when the chat tab is active**

In the render block where other tabs are conditionally rendered, add (next to the other `activeTab === '...'` checks):

```jsx
{activeTab === 'chat' && (
  <CourseChat courseId={courseId} courseName={courseName} />
)}
```

(`courseName` and `courseId` are the existing props — confirm exact names from the file.)

- [ ] **Step 4: Commit**

```bash
git add app/course/[courseId]/start/_components/CourseStartClient.jsx
git commit -m "feat(chat): add Chat tab to chapter workspace"
```

---

### Task 4: Standalone full-page chat

**Files:**
- Create: `app/course/[courseId]/chat/page.jsx`

- [ ] **Step 1: Create the page**

```jsx
import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { getPublishedCourseById } from '@/app/actions/course';
import CourseChat from '@/app/_components/CourseChat';
import Header from '@/app/dashboard/_components/Header';

export const metadata = { title: 'Chat — coursei.ai' };

export default async function CourseChatPage({ params }) {
  const { courseId } = await params;
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const course = await getPublishedCourseById(courseId);
  if (!course) notFound();

  return (
    <div className="min-h-screen dark:bg-gray-950">
      <Header />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-1">Chat with {course.name}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          AI tutor grounded in this course. Cite chapter names when relevant.
        </p>
        <CourseChat courseId={courseId} courseName={course.name} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/course/[courseId]/chat/page.jsx
git commit -m "feat(chat): add standalone /course/:id/chat page"
```

---

### Task 5: Smoke test for the route handler

**Files:**
- Create: `__tests__/api/chat.test.ts`

- [ ] **Step 1: Write the test**

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
  },
}));

vi.mock('@/server/ai/models', () => ({
  getModel: vi.fn().mockReturnValue('mock-model'),
}));

vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toUIMessageStreamResponse: () => new Response('mock-stream'),
  }),
}));

describe('POST /api/course/:courseId/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'postgres://x';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_x';
    process.env.CLERK_SECRET_KEY = 'sk_test_x';
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'g_test_x';
  });

  it('returns 401 when unauthenticated', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValueOnce({ userId: null });

    const { POST } = await import('@/app/api/course/[courseId]/chat/route');
    const req = new Request('http://test/api/course/c1/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }] }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ courseId: 'c1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 400 when messages is empty', async () => {
    const { POST } = await import('@/app/api/course/[courseId]/chat/route');
    const req = new Request('http://test/api/course/c1/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ courseId: 'c1' }) });
    expect(res.status).toBe(400);
  });

  it('returns streaming response when authenticated and messages present', async () => {
    const db = (await import('@/server/db')).db;
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          { courseId: 'c1', name: 'Test', courseOutput: { course: { description: 'd' } }, chapterId: 0, content: [{ title: 'Intro', explanation: 'Hello', code: '' }], videoId: '' },
        ]),
      }),
    });

    const { POST } = await import('@/app/api/course/[courseId]/chat/route');
    const req = new Request('http://test/api/course/c1/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }] }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ courseId: 'c1' }) });
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test**

Run: `npm test -- __tests__/api/chat.test.ts`
Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/api/chat.test.ts
git commit -m "test(chat): add smoke tests for chat route"
```

---

### Task 6: Verification

- [ ] Run `npm run lint` — must show "No ESLint warnings or errors"
- [ ] Run `npm test` — all original + 3 new chat tests must pass
- [ ] Run `npm run build` — must compile cleanly (the `@ai-sdk/react` import resolves via the `ai` package)
- [ ] Manually verify the import path: `grep -r "useChat" node_modules/ai/dist/index.d.ts` — `useChat` is exported from `ai/react` subpath

---

## Self-Review

- Spec coverage: ✅ task 1 (route), ✅ task 2 (client), ✅ task 3 (tab), ✅ task 4 (standalone page), ✅ task 5 (test), ✅ task 6 (verify).
- No placeholders: every step has the actual code.
- Type consistency: `UIMessage` is imported from `ai`; the route returns `result.toUIMessageStreamResponse()` which `useChat` consumes.
- DRY: `CourseChat` is the single chat UI; reused for tab and standalone page.
- Risk: `useChat` is imported from `@ai-sdk/react` — verify this resolves in the installed `ai` v6. If the export path differs, change the import to `'ai/react'`.
