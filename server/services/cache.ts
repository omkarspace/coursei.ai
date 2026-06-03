import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!redisUrl || !redisToken) return null;
  if (!redis) {
    redis = new Redis({ url: redisUrl, token: redisToken });
  }
  return redis;
}

/**
 * Get a cached value by key
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    const data = await r.get<T>(key);
    return data ?? null;
  } catch (error) {
    console.error(`Cache get error for ${key}:`, error);
    return null;
  }
}

/**
 * Set a cached value with TTL in seconds
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error(`Cache set error for ${key}:`, error);
  }
}

/**
 * Delete a cached value
 */
export async function cacheDel(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(key);
  } catch (error) {
    console.error(`Cache del error for ${key}:`, error);
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    const keys = await r.keys(pattern);
    if (keys.length > 0) {
      await r.del(...keys);
    }
  } catch (error) {
    console.error(`Cache del pattern error for ${pattern}:`, error);
  }
}

/**
 * Cache-aside helper: get from cache, or compute + cache
 */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  computeFn: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const value = await computeFn();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

// ===== Cache Key Generators =====
export const cacheKeys = {
  courseMeta: (courseId: string) => `course:${courseId}:meta`,
  courseContent: (courseId: string) => `course:${courseId}:content`,
  courseChapters: (courseId: string) => `course:${courseId}:chapters`,
  marketplaceList: (page: number, category?: string) =>
    `marketplace:${category || "all"}:${page}`,
  searchResults: (query: string) => `search:${query}`,
};

// ===== Cache TTLs (seconds) =====
export const cacheTTL = {
  courseMeta: 3600,       // 1 hour
  courseContent: 21600,   // 6 hours
  courseChapters: 3600,   // 1 hour
  marketplace: 300,       // 5 minutes
  search: 600,            // 10 minutes
};

// ===== Generic API (used by rating.ts) =====
export async function getCached<T>(key: string): Promise<T | null> {
  return cacheGet<T>(key);
}

export async function setCached(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  return cacheSet(key, value, ttlSeconds);
}

export async function invalidateCache(key: string): Promise<void> {
  return cacheDel(key);
}

// ===== Legacy API (used by course actions) =====
export async function getCachedCourse(courseId: string) {
  return cacheGet(cacheKeys.courseMeta(courseId));
}

export async function setCachedCourse(courseId: string, course: unknown) {
  return cacheSet(cacheKeys.courseMeta(courseId), course, cacheTTL.courseMeta);
}

export async function invalidateCourseCache(courseId: string) {
  await cacheDel(cacheKeys.courseMeta(courseId));
  await cacheDel(cacheKeys.courseContent(courseId));
  await cacheDel(cacheKeys.courseChapters(courseId));
  await cacheDelPattern(`marketplace:*`);
}
