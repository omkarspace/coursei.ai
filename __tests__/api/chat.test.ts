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
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
      }),
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
    let callIndex = 0;
    (db.select as any).mockImplementation(() => {
      const data: any[] = [
        // CourseList lookup
        [
          {
            courseId: 'c1',
            name: 'Test',
            courseOutput: { course: { description: 'd' } },
          },
        ],
        // Chapters lookup
        [
          {
            courseId: 'c1',
            chapterId: 0,
            content: [{ title: 'Intro', explanation: 'Hello', code: '' }],
            videoId: '',
          },
        ],
        // Quizzes lookup (empty)
        [],
        // Flashcards lookup (empty)
        [],
      ];
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(data[callIndex++] ?? []),
        }),
      };
    });

    const { POST } = await import('@/app/api/course/[courseId]/chat/route');
    const req = new Request('http://test/api/course/c1/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
      }),
    });
    const res = await POST(req as any, { params: Promise.resolve({ courseId: 'c1' }) });
    expect(res.status).toBe(200);
  });
});
