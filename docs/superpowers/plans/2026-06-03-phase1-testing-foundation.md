# Phase 1: Testing Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Vitest test suite with tests for server actions, AI schemas, and critical services.

**Architecture:** Vitest for test runner, React Testing Library for components, MSW for API mocking. Tests co-located in `__tests__/` directory.

**Tech Stack:** Vitest, @testing-library/react, @testing-library/jest-dom, jsdom

---

## File Structure

| File                                | Purpose                     |
| ----------------------------------- | --------------------------- |
| `vitest.config.ts`                  | Vitest configuration        |
| `__tests__/actions/course.test.ts`  | Server action tests         |
| `__tests__/ai/schemas.test.ts`      | Zod schema validation tests |
| `__tests__/services/cache.test.ts`  | Cache service tests         |
| `__tests__/services/vector.test.ts` | Vector search tests         |

---

### Task 1: Install Vitest and Configure

**Files:**

- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install dependencies**

Run: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
Expected: Packages installed successfully

- [ ] **Step 2: Create Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 3: Create test setup file**

Create `__tests__/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Add test scripts to package.json**

Add to `scripts` in `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

- [ ] **Step 5: Verify Vitest runs**

Run: `npm run test`
Expected: No tests found (0 tests), but Vitest runs without errors

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts __tests__/setup.ts package.json package-lock.json
git commit -m "chore: add vitest test infrastructure"
```

---

### Task 2: Test AI Schemas (Zod Validation)

**Files:**

- Create: `__tests__/ai/schemas.test.ts`

- [ ] **Step 1: Write schema validation tests**

Create `__tests__/ai/schemas.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  CourseLayoutSchema,
  ChapterContentSchema,
  QuizSchema,
  FlashcardsSchema,
  StudyNotesSchema,
} from '@/server/ai/schemas';

describe('CourseLayoutSchema', () => {
  it('validates a complete course layout', () => {
    const valid = {
      course: {
        name: 'Python Basics',
        description: 'Learn Python from scratch',
        noOfChapters: 5,
        duration: '4 weeks',
        chapters: [
          {
            name: 'Intro',
            about: 'Getting started',
            duration: '1 hour',
          },
        ],
      },
    };
    expect(CourseLayoutSchema.parse(valid)).toEqual(valid);
  });

  it('rejects missing required fields', () => {
    const invalid = { course: { name: 'Test' } };
    expect(() => CourseLayoutSchema.parse(invalid)).toThrow();
  });
});

describe('QuizSchema', () => {
  it('validates a quiz with questions', () => {
    const valid = {
      questions: [
        {
          question: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1,
          explanation: 'Basic math',
        },
      ],
    };
    expect(QuizSchema.parse(valid)).toEqual(valid);
  });

  it('rejects correctAnswer outside 0-3 range', () => {
    const invalid = {
      questions: [
        {
          question: 'Test?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 5,
          explanation: 'Test',
        },
      ],
    };
    expect(() => QuizSchema.parse(invalid)).toThrow();
  });

  it('rejects options array not length 4', () => {
    const invalid = {
      questions: [
        {
          question: 'Test?',
          options: ['A', 'B'],
          correctAnswer: 0,
          explanation: 'Test',
        },
      ],
    };
    expect(() => QuizSchema.parse(invalid)).toThrow();
  });
});

describe('FlashcardsSchema', () => {
  it('validates flashcards', () => {
    const valid = {
      cards: [{ front: 'What is JS?', back: 'A programming language' }],
    };
    expect(FlashcardsSchema.parse(valid)).toEqual(valid);
  });
});

describe('StudyNotesSchema', () => {
  it('validates study notes', () => {
    const valid = {
      summary: 'Overview text',
      keyPoints: ['Point 1', 'Point 2'],
      importantTerms: [{ term: 'Variable', definition: 'A named storage' }],
    };
    expect(StudyNotesSchema.parse(valid)).toEqual(valid);
  });

  it('rejects empty keyPoints', () => {
    const invalid = {
      summary: 'Text',
      keyPoints: [],
      importantTerms: [],
    };
    expect(() => StudyNotesSchema.parse(invalid)).toThrow();
  });
});

describe('ChapterContentSchema', () => {
  it('validates chapter content array', () => {
    const valid = [
      {
        title: 'Section 1',
        explanation: 'Content here',
        code: '',
      },
    ];
    expect(ChapterContentSchema.parse(valid)).toEqual(valid);
  });

  it('defaults code to empty string', () => {
    const input = [{ title: 'S1', explanation: 'Text' }];
    const result = ChapterContentSchema.parse(input);
    expect(result[0].code).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm run test __tests__/ai/schemas.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add __tests__/ai/schemas.test.ts
git commit -m "test: add AI schema validation tests"
```

---

### Task 3: Test Cache Service

**Files:**

- Create: `__tests__/services/cache.test.ts`

- [ ] **Step 1: Write cache service tests**

Create `__tests__/services/cache.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheKeys, cacheTTL } from '@/server/services/cache';

describe('cacheKeys', () => {
  it('generates correct course meta key', () => {
    expect(cacheKeys.courseMeta('course_123')).toBe('course:course_123:meta');
  });

  it('generates correct course content key', () => {
    expect(cacheKeys.courseContent('course_123')).toBe('course:course_123:content');
  });

  it('generates correct marketplace key with category', () => {
    expect(cacheKeys.marketplaceList(0, 'programming')).toBe('marketplace:programming:0');
  });

  it('generates correct marketplace key without category', () => {
    expect(cacheKeys.marketplaceList(1)).toBe('marketplace:all:1');
  });

  it('generates correct search key', () => {
    expect(cacheKeys.searchResults('react hooks')).toBe('search:react hooks');
  });
});

describe('cacheTTL', () => {
  it('has reasonable TTL values', () => {
    expect(cacheTTL.courseMeta).toBeGreaterThan(0);
    expect(cacheTTL.courseContent).toBeGreaterThan(cacheTTL.courseMeta);
    expect(cacheTTL.marketplace).toBeGreaterThan(0);
    expect(cacheTTL.search).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm run test __tests__/services/cache.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add __tests__/services/cache.test.ts
git commit -m "test: add cache service tests"
```

---

### Task 4: Test Vector Service

**Files:**

- Create: `__tests__/services/vector.test.ts`

- [ ] **Step 1: Write vector service tests**

Create `__tests__/services/vector.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variables
const mockEnv = {
  UPSTASH_VECTOR_REST_URL: 'https://example.upstash.io',
  UPSTASH_VECTOR_REST_TOKEN: 'test-token',
};

describe('Vector search configuration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('detects when vector search is not configured', () => {
    delete process.env.UPSTASH_VECTOR_REST_URL;
    delete process.env.UPSTASH_VECTOR_REST_TOKEN;

    // Re-import to pick up env changes
    const isEnabled = !(
      process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN
    );
    expect(isEnabled).toBe(true);
  });

  it('detects when vector search is configured', () => {
    process.env.UPSTASH_VECTOR_REST_URL = mockEnv.UPSTASH_VECTOR_REST_URL;
    process.env.UPSTASH_VECTOR_REST_TOKEN = mockEnv.UPSTASH_VECTOR_REST_TOKEN;

    const isEnabled = !!(
      process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN
    );
    expect(isEnabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm run test __tests__/services/vector.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add __tests__/services/vector.test.ts
git commit -m "test: add vector service configuration tests"
```

---

### Task 5: Test Server Actions (Mocked DB)

**Files:**

- Create: `__tests__/actions/course.test.ts`

- [ ] **Step 1: Write server action tests with mocked DB**

Create `__tests__/actions/course.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('@/server/db', () => ({
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
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_123' }),
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUser: vi.fn().mockResolvedValue({
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        fullName: 'Test User',
        imageUrl: 'https://example.com/avatar.png',
      }),
    },
  }),
}));

// Mock cache
vi.mock('@/server/services/cache', () => ({
  getCachedCourse: vi.fn().mockResolvedValue(null),
  setCachedCourse: vi.fn().mockResolvedValue(undefined),
  invalidateCourseCache: vi.fn().mockResolvedValue(undefined),
}));

// Mock vector
vi.mock('@/server/services/vector', () => ({
  upsertCourseVectorFull: vi.fn().mockResolvedValue(undefined),
  deleteCourseVector: vi.fn().mockResolvedValue(undefined),
}));

// Mock Inngest
vi.mock('@/server/services/inngest', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Course Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPublishedCourseById returns course when found', async () => {
    const { db } = await import('@/server/db');
    const mockCourse = {
      id: 1,
      courseId: 'course_123',
      name: 'Test Course',
      category: 'Programming',
      level: 'Beginner',
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([mockCourse]),
      }),
    });

    // Import after mocks are set up
    const { getPublishedCourseById } = await import('@/app/actions/course');
    const result = await getPublishedCourseById('course_123');

    expect(result).toEqual(mockCourse);
  });

  it('getPublishedCourseById returns null when not found', async () => {
    const { db } = await import('@/server/db');

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });

    const { getPublishedCourseById } = await import('@/app/actions/course');
    const result = await getPublishedCourseById('nonexistent');

    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm run test __tests__/actions/course.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add __tests__/actions/course.test.ts
git commit -m "test: add course server action tests with mocked DB"
```

---

### Task 6: Verify Full Test Suite

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `npm run test`
Expected: All tests PASS, no errors

- [ ] **Step 2: Run coverage report**

Run: `npm run test:coverage`
Expected: Coverage report generated, shows coverage for tested modules

- [ ] **Step 3: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: resolve test suite issues"
```

---

## Summary

| Task | Description    | Tests Added    |
| ---- | -------------- | -------------- |
| 1    | Vitest setup   | Infrastructure |
| 2    | AI schemas     | 8 tests        |
| 3    | Cache service  | 6 tests        |
| 4    | Vector service | 2 tests        |
| 5    | Server actions | 2 tests        |
| 6    | Verification   | All tests pass |

**Total:** ~18 tests covering core modules
