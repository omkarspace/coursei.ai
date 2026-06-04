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

// Validate on module load (side effect import)
validateEnv();
