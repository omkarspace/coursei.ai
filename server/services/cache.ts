import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!redis) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
    return redis;
  }
  return null;
}

const DEFAULT_TTL = 3600; // 1 hour

export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    const data = await client.get<T>(key);
    return data;
  } catch (error) {
    console.error("Cache read error:", error);
    return null;
  }
}

export async function setCached<T>(key: string, data: T, ttl = DEFAULT_TTL): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.set(key, data, { ex: ttl });
  } catch (error) {
    console.error("Cache write error:", error);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
}

export async function getCachedCourse(courseId: string) {
  return getCached(`course:${courseId}`);
}

export async function setCachedCourse(courseId: string, data: any) {
  await setCached(`course:${courseId}`, data);
}

export async function invalidateCourseCache(courseId: string) {
  await invalidateCache(`course:${courseId}*`);
}
