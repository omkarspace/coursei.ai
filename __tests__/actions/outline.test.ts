import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUser: vi.fn().mockResolvedValue({
        emailAddresses: [{ emailAddress: 'a@b.com' }],
      }),
    },
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

vi.mock('@/server/services/cache', () => ({
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/server/ai/agents/curriculum-designer', () => ({
  designCurriculum: vi.fn().mockResolvedValue({
    course: {
      name: 'Test Course',
      description: 'Test description',
      duration: '4 weeks',
      chapters: [
        { name: 'Ch1', about: 'a1', duration: '1 week', learningObjectives: [], difficulty: 'beginner', prerequisites: [] },
        { name: 'Ch2', about: 'a2', duration: '1 week', learningObjectives: [], difficulty: 'beginner', prerequisites: [] },
      ],
    },
  }),
}));

vi.mock('@/server/ai/agents/fact-checker', () => ({
  checkFacts: vi.fn().mockImplementation(async (curriculum) => ({
    verified: true,
    citations: [],
    flaggedIssues: [],
    adjustedChapters: curriculum.course.chapters,
  })),
}));

vi.mock('@/server/ai/agents/pedagogical-expert', () => ({
  reviewPedagogy: vi.fn().mockImplementation(async (chapters) => ({
    finalChapters: chapters,
    quizPrompts: [],
    codeBlockPlaceholders: [],
    difficultyAdjustments: [],
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('outline server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'postgres://x';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_x';
    process.env.CLERK_SECRET_KEY = 'sk_test_x';
  });

  it('saveOutlineAction rejects when status is not outline_ready', async () => {
    const db = (await import('@/server/db')).db;
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          {
            courseId: 'c1',
            status: 'draft',
            courseOutput: { course: { chapters: [{ name: 'a', about: 'b', duration: '1d' }] } },
          },
        ]),
      }),
    });

    const { saveOutlineAction } = await import('@/app/actions/outline');
    await expect(saveOutlineAction('c1', [{ name: 'a', about: 'b' }])).rejects.toThrow(
      /editable state/
    );
  });

  it('saveOutlineAction succeeds when status is outline_ready', async () => {
    const db = (await import('@/server/db')).db;
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          {
            courseId: 'c1',
            status: 'outline_ready',
            courseOutput: {
              course: {
                name: 'T',
                description: 'd',
                duration: '4w',
                chapters: [
                  { name: 'orig1', about: 'o1', duration: '1w' },
                  { name: 'orig2', about: 'o2', duration: '1w' },
                ],
              },
            },
          },
        ]),
      }),
    });

    const { saveOutlineAction } = await import('@/app/actions/outline');
    await expect(
      saveOutlineAction('c1', [
        { name: 'new1', about: 'n1' },
        { name: 'new2', about: 'n2' },
      ])
    ).resolves.toBeUndefined();
  });
});
