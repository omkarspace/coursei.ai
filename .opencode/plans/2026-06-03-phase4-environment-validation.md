# Phase 4: Environment Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate all environment variables at app startup, failing fast with descriptive error messages for required vars and warnings for optional ones.

**Architecture:** Create `lib/env.ts` with Zod validation schemas, import in `app/layout.tsx` to run before any page renders. Services continue graceful fallback for optional vars.

**Tech Stack:** Zod (already in package.json), TypeScript

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Create | `lib/env.ts` | Environment validation logic |
| Modify | `app/layout.js` | Import env validation at startup |
| Create | `__tests__/lib/env.test.ts` | Tests for validation logic |

---

## Task 1: Create Environment Validation Module

**Files:**
- Create: `lib/env.ts`

- [ ] **Step 1: Create the env validation module**

```typescript
// lib/env.ts
import { z } from 'zod';

/**
 * Environment variable validation schema
 * Required variables will throw on missing
 * Optional variables will log warnings
 */
const requiredEnvSchema = z.object({
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid PostgreSQL connection URL' }),
  CLERK_SECRET_KEY: z.string().min(1, { message: 'CLERK_SECRET_KEY is required for authentication' }),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, { message: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required for Clerk client' }),
  NEXT_PUBLIC_GEMINI_API_KEY: z.string().min(1, { message: 'NEXT_PUBLIC_GEMINI_API_KEY is required for AI generation' }),
});

const optionalEnvSchema = z.object({
  // Caching
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Vector search
  UPSTASH_VECTOR_REST_URL: z.string().url().optional(),
  UPSTASH_VECTOR_REST_TOKEN: z.string().optional(),
  
  // Knowledge graph
  NEO4J_URI: z.string().optional(),
  NEO4J_PASSWORD: z.string().optional(),
  NEO4J_USER: z.string().optional(),
  
  // AI services
  FAL_KEY: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  
  // Media services
  ASSEMBLYAI_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  
  // Storage
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  LOCAL_STORAGE_DIR: z.string().optional(),
  
  // Client-side
  NEXT_PUBLIC_YOUTUBE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_HOST_NAME: z.string().url().optional(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().optional(),
}).passthrough();

export type RequiredEnv = z.infer<typeof requiredEnvSchema>;
export type OptionalEnv = z.infer<typeof optionalEnvSchema>;
export type AppEnv = RequiredEnv & OptionalEnv;

/**
 * Validate required environment variables
 * Throws immediately if any are missing
 */
function validateRequired(): RequiredEnv {
  const result = requiredEnvSchema.safeParse(process.env);
  
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const missing = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(', ')}`)
      .join('\n');
    
    throw new Error(
      `\n❌ Missing required environment variables:\n${missing}\n\n` +
      `Add these to your .env.local file. See .env.example for reference.\n`
    );
  }
  
  return result.data;
}

/**
 * Validate optional environment variables
 * Logs warnings for missing ones, returns parsed values
 */
function validateOptional(): OptionalEnv {
  const result = optionalEnvSchema.safeParse(process.env);
  
  if (!result.success) {
    console.warn('⚠️  Some optional environment variables have invalid values:');
    const errors = result.error.flatten().fieldErrors;
    Object.entries(errors).forEach(([key, msgs]) => {
      console.warn(`  ${key}: ${msgs?.join(', ')}`);
    });
  }
  
  // Check for common service groups
  const env = process.env;
  const warnings: string[] = [];
  
  // Redis caching
  if (env.UPSTASH_REDIS_REST_URL && !env.UPSTASH_REDIS_REST_TOKEN) {
    warnings.push('UPSTASH_REDIS_REST_TOKEN is set but UPSTASH_REDIS_REST_URL is missing');
  }
  if (!env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    warnings.push('UPSTASH_REDIS_REST_URL is set but UPSTASH_REDIS_REST_TOKEN is missing');
  }
  
  // Vector search
  if (env.UPSTASH_VECTOR_REST_URL && !env.UPSTASH_VECTOR_REST_TOKEN) {
    warnings.push('UPSTASH_VECTOR_REST_TOKEN is set but UPSTASH_VECTOR_REST_URL is missing');
  }
  if (!env.UPSTASH_VECTOR_REST_URL && env.UPSTASH_VECTOR_REST_TOKEN) {
    warnings.push('UPSTASH_VECTOR_REST_URL is set but UPSTASH_VECTOR_REST_TOKEN is missing');
  }
  
  // Cloudinary
  if (env.CLOUDINARY_CLOUD_NAME && (!env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET)) {
    warnings.push('CLOUDINARY_CLOUD_NAME is set but CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET is missing');
  }
  
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment variable warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
    console.warn('');
  }
  
  return (result.data ?? {}) as OptionalEnv;
}

/**
 * Main validation function
 * Call once at app startup (in layout.tsx)
 */
let validated = false;
let env: AppEnv;

export function validateEnv(): AppEnv {
  if (validated) return env;
  
  console.log('🔍 Validating environment variables...');
  
  const required = validateRequired();
  const optional = validateOptional();
  
  env = { ...required, ...optional };
  validated = true;
  
  console.log('✅ Environment variables validated\n');
  
  return env;
}

/**
 * Get validated environment variables
 * Must call validateEnv() first
 */
export function getEnv(): AppEnv {
  if (!validated) {
    throw new Error('Environment not validated. Call validateEnv() first.');
  }
  return env;
}

/**
 * Check if a service is configured
 * Use this in services instead of checking process.env directly
 */
export function isServiceEnabled(service: string): boolean {
  const env = getEnv();
  
  switch (service) {
    case 'redis':
      return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
    case 'vector':
      return !!(env.UPSTASH_VECTOR_REST_URL && env.UPSTASH_VECTOR_REST_TOKEN);
    case 'neo4j':
      return !!(env.NEO4J_URI && env.NEO4J_PASSWORD);
    case 'fal':
      return !!env.FAL_KEY;
    case 'assemblyai':
      return !!env.ASSEMBLYAI_API_KEY;
    case 'elevenlabs':
      return !!env.ELEVENLABS_API_KEY;
    case 'cloudinary':
      return !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
    case 'tavily':
      return !!env.TAVILY_API_KEY;
    case 'youtube':
      return !!env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    default:
      return false;
  }
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit lib/env.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/env.ts
git commit -m "feat: add environment variable validation with Zod"
```

---

## Task 2: Integrate Validation in App Layout

**Files:**
- Modify: `app/layout.js` (lines 1-5)

- [ ] **Step 1: Add env validation import to layout**

The env validation runs when the module is imported. By importing it at the top of layout.tsx, it runs before any page renders.

```javascript
// app/layout.js - Add at line 1 (before other imports)
import '@/lib/env'; // Validate env vars at startup - throws if required vars missing

// Rest of existing imports follow...
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
```

- [ ] **Step 2: Verify layout still works**

Run: `npm run build`
Expected: Build succeeds (validates env is imported correctly)

- [ ] **Step 3: Commit**

```bash
git add app/layout.js
git commit -m "feat: integrate env validation at app startup"
```

---

## Task 3: Write Tests for Environment Validation

**Files:**
- Create: `__tests__/lib/env.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
// __tests__/lib/env.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Environment Validation', () => {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    // Reset validation state by clearing module cache
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
      
      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).toThrow('DATABASE_URL');
    });
    
    it('should throw when CLERK_SECRET_KEY is missing', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      delete process.env.CLERK_SECRET_KEY;
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';
      
      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).toThrow('CLERK_SECRET_KEY');
    });
    
    it('should throw when multiple required variables are missing', async () => {
      delete process.env.DATABASE_URL;
      delete process.env.CLERK_SECRET_KEY;
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      delete process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).toThrow('Missing required environment variables');
    });
    
    it('should reject invalid DATABASE_URL format', async () => {
      process.env.DATABASE_URL = 'not-a-url';
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';
      
      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).toThrow('DATABASE_URL');
    });
  });
  
  describe('optionalEnvSchema', () => {
    it('should not throw when optional variables are missing', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123';
      process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'AIzaSyD123';
      
      // Ensure optional vars are not set
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
```

- [ ] **Step 2: Run the tests**

Run: `npm run test __tests__/lib/env.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/env.test.ts
git commit -m "test: add environment validation tests"
```

---

## Task 4: Create .env.example File

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create .env.example with all variables documented**

```bash
# ===========================================
# REQUIRED - App won't start without these
# ===========================================

# Neon PostgreSQL connection string
DATABASE_URL=postgresql://user:password@ep-example.us-east-2.aws.neon.tech/dbname

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# ===========================================
# OPTIONAL - App works without these
# ===========================================

# Upstash Redis (caching)
# UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
# UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Upstash Vector (semantic search)
# UPSTASH_VECTOR_REST_URL=https://your-vector-instance.upstash.io
# UPSTASH_VECTOR_REST_TOKEN=your_vector_token

# Neo4j (knowledge graph)
# NEO4J_URI=neo4j+s://your-neo4j-instance.databases.neo4j.io
# NEO4J_PASSWORD=your_neo4j_password
# NEO4J_USER=neo4j

# Fal.ai (image generation)
# FAL_KEY=your_fal_key

# Tavily (fact verification)
# TAVILY_API_KEY=your_tavily_key

# AssemblyAI (transcription)
# ASSEMBLYAI_API_KEY=your_assemblyai_key

# ElevenLabs (text-to-speech)
# ELEVENLABS_API_KEY=your_elevenlabs_key

# Cloudinary (image uploads)
# STORAGE_PROVIDER=cloudinary
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret

# Local storage (default)
# STORAGE_PROVIDER=local
# LOCAL_STORAGE_DIR=./public/uploads

# Client-side
# NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_key
# NEXT_PUBLIC_HOST_NAME=http://localhost:3000
# NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
# NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

- [ ] **Step 2: Add .env.example to git**

```bash
git add .env.example
git commit -m "docs: add .env.example with all environment variables"
```

---

## Verification Checklist

After completing all tasks:

- [ ] Run `npm run build` - should succeed
- [ ] Run `npm run test` - all tests pass
- [ ] Run `npx tsc --noEmit` - no type errors
- [ ] Test with missing required var - should fail fast with clear error
- [ ] Test with all vars present - should start successfully
- [ ] Check console output shows validation messages

---

## Notes

- The validation runs once at startup (singleton pattern with `validated` flag)
- `validateEnv()` is idempotent - safe to call multiple times
- Services can still use `process.env` directly for backward compatibility
- `isServiceEnabled()` is a convenience function for new code
- Zod schemas are exported for use in other validation contexts
