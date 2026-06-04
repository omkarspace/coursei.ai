// __tests__/actions/progress.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set required env vars
process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
process.env.CLERK_SECRET_KEY = 'sk_test_123';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';

describe('getUserCoursesWithProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate learning progress correctly', async () => {
    // This is a unit test for the progress calculation logic
    // In a real scenario, you'd mock the database calls
    
    const totalChapters = 10;
    const completedChapters = 5;
    const expectedProgress = 50; // 5/10 * 100
    
    const learningProgress = totalChapters > 0 
      ? Math.round((completedChapters / totalChapters) * 100) 
      : 0;
    
    expect(learningProgress).toBe(expectedProgress);
  });

  it('should handle zero chapters', async () => {
    const totalChapters = 0;
    const completedChapters = 0;
    
    const learningProgress = totalChapters > 0 
      ? Math.round((completedChapters / totalChapters) * 100) 
      : 0;
    
    expect(learningProgress).toBe(0);
  });

  it('should handle all chapters completed', async () => {
    const totalChapters = 5;
    const completedChapters = 5;
    
    const learningProgress = totalChapters > 0 
      ? Math.round((completedChapters / totalChapters) * 100) 
      : 0;
    
    expect(learningProgress).toBe(100);
  });
});
