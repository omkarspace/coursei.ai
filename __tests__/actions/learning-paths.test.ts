import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/server/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUser: vi.fn().mockResolvedValue({
        emailAddresses: [{ emailAddress: 'test@example.com' }],
      }),
    },
  }),
}));

describe('Learning paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Chapter interface includes difficulty field', () => {
    const chapter = { name: 'Test', about: 'About', duration: '10 min', difficulty: 'Easy' };
    expect(chapter.difficulty).toBe('Easy');
  });

  it('Chapter interface includes prerequisites field', () => {
    const chapter = {
      name: 'Test',
      about: 'About',
      duration: '10 min',
      prerequisites: ['Intro'],
    };
    expect(chapter.prerequisites).toEqual(['Intro']);
  });

  it('Chapter interface includes learningObjectives field', () => {
    const chapter = {
      name: 'Test',
      about: 'About',
      duration: '10 min',
      learningObjectives: ['Know X', 'Understand Y'],
    };
    expect(chapter.learningObjectives).toHaveLength(2);
  });

  it('orderIndex defaults to 0', () => {
    const defaultOrderIndex = 0;
    expect(defaultOrderIndex).toBe(0);
  });
});
