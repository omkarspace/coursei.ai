import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Environment Validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('requiredEnvSchema', () => {
    it('should pass with all required variables', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).not.toThrow();
    });

    it('should throw when DATABASE_URL is missing', async () => {
      delete process.env.DATABASE_URL;
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';

      await expect(import('@/lib/env')).rejects.toThrow('DATABASE_URL');
    });

    it('should throw when CLERK_SECRET_KEY is missing', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      delete process.env.CLERK_SECRET_KEY;
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';

      await expect(import('@/lib/env')).rejects.toThrow('CLERK_SECRET_KEY');
    });

    it('should throw when multiple required variables are missing', async () => {
      delete process.env.DATABASE_URL;
      delete process.env.CLERK_SECRET_KEY;
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;

      await expect(import('@/lib/env')).rejects.toThrow('Missing required environment variables');
    });

    it('should reject invalid DATABASE_URL format', async () => {
      process.env.DATABASE_URL = 'not-a-url';
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';

      await expect(import('@/lib/env')).rejects.toThrow('DATABASE_URL');
    });
  });

  describe('optionalEnvSchema', () => {
    it('should not throw when optional variables are missing', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';

      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      delete process.env.FAL_KEY;

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).not.toThrow();
    });

    it('should accept valid optional variables', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';

      process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
      process.env.FAL_KEY = 'fal_test_key';

      const { validateEnv } = await import('@/lib/env');
      const env = validateEnv();

      expect(env.UPSTASH_REDIS_REST_URL).toBe('https://example.upstash.io');
      expect(env.UPSTASH_REDIS_REST_TOKEN).toBe('test-token');
      expect(env.FAL_KEY).toBe('fal_test_key');
    });
  });

  describe('isServiceEnabled', () => {
    it('should return true when service is configured', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';
      process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      const { validateEnv, isServiceEnabled } = await import('@/lib/env');
      validateEnv();

      expect(isServiceEnabled('redis')).toBe(true);
    });

    it('should return false when service is not configured', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';

      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const { validateEnv, isServiceEnabled } = await import('@/lib/env');
      validateEnv();

      expect(isServiceEnabled('redis')).toBe(false);
    });

    it('should return false for unknown service', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';

      const { validateEnv, isServiceEnabled } = await import('@/lib/env');
      validateEnv();

      expect(isServiceEnabled('unknown')).toBe(false);
    });
  });
});
