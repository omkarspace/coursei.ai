import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("@/server/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
  },
}));

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ userId: "user_123" }),
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUser: vi.fn().mockResolvedValue({
        emailAddresses: [{ emailAddress: "test@example.com" }],
        fullName: "Test User",
        imageUrl: "https://example.com/avatar.png",
      }),
    },
  }),
}));

// Mock cache
vi.mock("@/server/services/cache", () => ({
  getCachedCourse: vi.fn().mockResolvedValue(null),
  setCachedCourse: vi.fn().mockResolvedValue(undefined),
  invalidateCourseCache: vi.fn().mockResolvedValue(undefined),
}));

// Mock vector
vi.mock("@/server/services/vector", () => ({
  upsertCourseVectorFull: vi.fn().mockResolvedValue(undefined),
  deleteCourseVector: vi.fn().mockResolvedValue(undefined),
}));

// Mock Inngest
vi.mock("@/server/services/inngest", () => ({
  inngest: {
    send: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Course Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPublishedCourseById returns course when found", async () => {
    const { db } = await import("@/server/db");
    const mockCourse = {
      id: 1,
      courseId: "course_123",
      name: "Test Course",
      category: "Programming",
      level: "Beginner",
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockCourse]),
      }),
    });

    // Import after mocks are set up
    const { getPublishedCourseById } = await import("@/app/actions/course");
    const result = await getPublishedCourseById("course_123");

    expect(result).toEqual(mockCourse);
  });

  it("getPublishedCourseById returns null when not found", async () => {
    const { db } = await import("@/server/db");

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const { getPublishedCourseById } = await import("@/app/actions/course");
    const result = await getPublishedCourseById("nonexistent");

    expect(result).toBeNull();
  });
});
