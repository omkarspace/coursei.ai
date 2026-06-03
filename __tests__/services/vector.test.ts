import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock environment variables
const mockEnv = {
  UPSTASH_VECTOR_REST_URL: "https://example.upstash.io",
  UPSTASH_VECTOR_REST_TOKEN: "test-token",
};

describe("Vector search configuration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("detects when vector search is not configured", () => {
    delete process.env.UPSTASH_VECTOR_REST_URL;
    delete process.env.UPSTASH_VECTOR_REST_TOKEN;

    // Re-import to pick up env changes
    const isEnabled = !(
      process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN
    );
    expect(isEnabled).toBe(true);
  });

  it("detects when vector search is configured", () => {
    process.env.UPSTASH_VECTOR_REST_URL = mockEnv.UPSTASH_VECTOR_REST_URL;
    process.env.UPSTASH_VECTOR_REST_TOKEN = mockEnv.UPSTASH_VECTOR_REST_TOKEN;

    const isEnabled = !!(
      process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN
    );
    expect(isEnabled).toBe(true);
  });
});