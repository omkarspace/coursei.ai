import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { Chapters, CourseList, Flashcards, Quizzes } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { streamText, type UIMessage } from 'ai';
import { getModel } from '@/server/ai/models';

export const maxDuration = 30;

interface RouteContext {
  params: Promise<{ courseId: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const { courseId } = await params;
  const body = await req.json().catch(() => null);
  const messages = body?.messages as UIMessage[] | undefined;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response('messages required', { status: 400 });
  }

  const courseRows = await db.select().from(CourseList).where(eq(CourseList.courseId, courseId));
  const course = courseRows[0];
  if (!course) return new Response('Course not found', { status: 404 });

  const chapterRows = await db.select().from(Chapters).where(eq(Chapters.courseId, courseId));
  const chapterRowsSorted = chapterRows.sort((a, b) => a.chapterId - b.chapterId);

  const quizRows = await db.select().from(Quizzes).where(eq(Quizzes.courseId, courseId));
  const flashcardRows = await db.select().from(Flashcards).where(eq(Flashcards.courseId, courseId));

  const chapterText = chapterRowsSorted
    .map(
      (ch) =>
        `### Chapter ${ch.chapterId + 1}: ${ch.content.map((c) => c.title).join(', ')}\n` +
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
Course description: ${(course.courseOutput as { course?: { description?: string } })?.course?.description ?? ''}

Your job: answer the student's questions using ONLY the course material below. Be concise, give examples from the content, and reference chapters by name when relevant (e.g. "In chapter 3, you'll see…").

If a question is outside the course scope, say so and suggest what to study instead. Do not invent facts.

===== COURSE CONTENT =====
${chapterText}
===== END COURSE CONTENT =====

This course has:
- ${quizText || 'no quizzes yet'}
- ${flashcardText || 'no flashcards yet'}
`;

  const result = streamText({
    model: getModel('gemini-1.5-flash'),
    system,
    messages: messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content:
        m.parts
          ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join('\n') ?? '',
    })),
  });

  return result.toUIMessageStreamResponse();
}
