/**
 * Upstash Vector service for semantic search
 * Uses REST API directly (no SDK dependency)
 */

import { isServiceEnabled } from '@/lib/env';

const UPSTASH_VECTOR_URL = process.env.UPSTASH_VECTOR_REST_URL;
const UPSTASH_VECTOR_TOKEN = process.env.UPSTASH_VECTOR_REST_TOKEN;

interface VectorPoint {
  id: string;
  vector: number[];
  metadata: Record<string, string | number | boolean>;
}

interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, string | number | boolean>;
}

function isVectorEnabled(): boolean {
  return isServiceEnabled('vector');
}

async function vectorFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!UPSTASH_VECTOR_URL || !UPSTASH_VECTOR_TOKEN) {
    throw new Error('Upstash Vector not configured');
  }

  const response = await fetch(`${UPSTASH_VECTOR_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${UPSTASH_VECTOR_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upstash Vector error: ${response.status} - ${text}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Upsert a course into the vector index
 */
export async function upsertCourseVector(
  courseId: string,
  name: string,
  description: string,
  category: string,
  level: string
): Promise<void> {
  if (!isVectorEnabled()) {
    console.log('Upstash Vector not configured, skipping indexing');
    return;
  }

  const text = `${name} ${description} ${category} ${level}`;

  // Generate a simple embedding using a hash-based approach
  // In production, use a proper embedding model (e.g., OpenAI, Cohere)
  const vector = generateSimpleEmbedding(text);

  await vectorFetch('/upsert', {
    method: 'POST',
    body: JSON.stringify({
      id: `course:${courseId}`,
      vector,
      metadata: {
        courseId,
        name,
        description: description.slice(0, 500),
        category,
        level,
        type: 'course',
      },
    }),
  });
}

/**
 * Upsert a course into the vector index with enriched chapter data
 */
export async function upsertCourseVectorFull(
  courseId: string,
  name: string,
  description: string,
  category: string,
  level: string,
  chapters: { name: string; about: string }[]
): Promise<void> {
  if (!isVectorEnabled()) {
    console.log('Upstash Vector not configured, skipping indexing');
    return;
  }

  // Combine course metadata with chapter names and descriptions for richer embedding
  const chapterText = chapters.map((ch) => `${ch.name}: ${ch.about}`).join(' ');
  const text = `${name} ${description} ${category} ${level} ${chapterText}`;

  const vector = generateSimpleEmbedding(text);

  await vectorFetch('/upsert', {
    method: 'POST',
    body: JSON.stringify({
      id: `course:${courseId}`,
      vector,
      metadata: {
        courseId,
        name,
        description: description.slice(0, 500),
        category,
        level,
        chapters: chapters.map((ch) => ch.name).join(', '),
        type: 'course',
      },
    }),
  });
}

/**
 * Delete a course from the vector index
 */
export async function deleteCourseVector(courseId: string): Promise<void> {
  if (!isVectorEnabled()) return;

  try {
    await vectorFetch(`/delete/id/course:${courseId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting course vector:', error);
  }
}

/**
 * Semantic search for courses
 */
export async function searchCourses(query: string, topK = 10): Promise<SearchResult[]> {
  if (!isVectorEnabled()) {
    return [];
  }

  const vector = generateSimpleEmbedding(query);

  const result = await vectorFetch<{ results: SearchResult[] }>('/query', {
    method: 'POST',
    body: JSON.stringify({
      vector,
      topK,
      filter: { type: 'course' },
      includeMetadata: true,
    }),
  });

  return result.results || [];
}

/**
 * Simple hash-based embedding for demo purposes
 * In production, use a proper embedding model via API
 */
function generateSimpleEmbedding(text: string): number[] {
  const dimensions = 1536;
  const vector: number[] = new Array(dimensions).fill(0);

  const normalizedText = text.toLowerCase().trim();

  for (let i = 0; i < normalizedText.length; i++) {
    const charCode = normalizedText.charCodeAt(i);
    const position = i % dimensions;
    vector[position] = (vector[position] ?? 0) + charCode / 1000;

    const hashPosition = (position * 31 + charCode) % dimensions;
    vector[hashPosition] = (vector[hashPosition] ?? 0) + Math.sin(charCode * 0.1) * 0.5;
  }

  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] = (vector[i] ?? 0) / magnitude;
    }
  }

  return vector;
}

/**
 * Check if vector search is available
 */
export function isVectorSearchEnabled(): boolean {
  return isVectorEnabled();
}
