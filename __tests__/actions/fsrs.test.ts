import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
}));

vi.mock('@/server/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 1 }]),
  },
}));

vi.mock('@/server/services/cache', () => ({
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}));

describe('FSRS server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = 'postgres://x';
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_x';
    process.env.CLERK_SECRET_KEY = 'sk_test_x';
  });

  it('getDueFlashcardsAction returns up to 20 due rows for the user', async () => {
    const due = [
      { id: 1, userId: 'user_123', courseId: 'c1', chapterId: 0, cardIndex: 0, due: new Date() },
      { id: 2, userId: 'user_123', courseId: 'c1', chapterId: 0, cardIndex: 1, due: new Date() },
    ];
    const db = (await import('@/server/db')).db;
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(due),
          }),
        }),
      }),
    });

    const { getDueFlashcardsAction } = await import('@/app/actions/fsrs');
    const result = await getDueFlashcardsAction();
    expect(result).toHaveLength(2);
  });

  it('getDueCountAction returns count of due cards', async () => {
    const db = (await import('@/server/db')).db;
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: '5' }]),
      }),
    });

    const { getDueCountAction } = await import('@/app/actions/fsrs');
    const count = await getDueCountAction('user_123');
    expect(count).toBe(5);
  });

  it('getReviewStreakAction returns 0 when user has no reviews', async () => {
    const db = (await import('@/server/db')).db;
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          groupBy: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    });

    const { getReviewStreakAction } = await import('@/app/actions/fsrs');
    const streak = await getReviewStreakAction('user_123');
    expect(streak).toBe(0);
  });
});
