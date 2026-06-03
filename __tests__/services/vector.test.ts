import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Save original env values
const originalEnv = {
  UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
  UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN,
};

describe("Vector search configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.UPSTASH_VECTOR_REST_URL;
    delete process.env.UPSTASH_VECTOR_REST_TOKEN;
  });

  afterEach(() => {
    // Restore original env values
    if (originalEnv.UPSTASH_VECTOR_REST_URL === undefined) {
      delete process.env.UPSTASH_VECTOR_REST_URL;
    } else {
      process.env.UPSTASH_VECTOR_REST_URL = originalEnv.UPSTASH_VECTOR_REST_URL;
    }
    if (originalEnv.UPSTASH_VECTOR_REST_TOKEN === undefined) {
      delete process.env.UPSTASH_VECTOR_REST_TOKEN;
    } else {
      process.env.UPSTASH_VECTOR_REST_TOKEN = originalEnv.UPSTASH_VECTOR_REST_TOKEN;
    }
  });

  it("detects when vector search is not configured", async () => {
    const { isVectorSearchEnabled } = await import("@/server/services/vector");
    expect(isVectorSearchEnabled()).toBe(false);
  });

  it("detects when vector search is configured", async () => {
    process.env.UPSTASH_VECTOR_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_VECTOR_REST_TOKEN = "test-token";

    const { isVectorSearchEnabled } = await import("@/server/services/vector");
    expect(isVectorSearchEnabled()).toBe(true);
  });

  it("returns false when only URL is set", async () => {
    process.env.UPSTASH_VECTOR_REST_URL = "https://example.upstash.io";

    const { isVectorSearchEnabled } = await import("@/server/services/vector");
    expect(isVectorSearchEnabled()).toBe(false);
  });

  it("returns false when only token is set", async () => {
    process.env.UPSTASH_VECTOR_REST_TOKEN = "test-token";

    const { isVectorSearchEnabled } = await import("@/server/services/vector");
    expect(isVectorSearchEnabled()).toBe(false);
  });
});
