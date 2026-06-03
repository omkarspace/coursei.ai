import { describe, it, expect, vi, beforeEach } from "vitest";
import { cacheKeys, cacheTTL } from "@/server/services/cache";

describe("cacheKeys", () => {
  it("generates correct course meta key", () => {
    expect(cacheKeys.courseMeta("course_123")).toBe("course:course_123:meta");
  });

  it("generates correct course content key", () => {
    expect(cacheKeys.courseContent("course_123")).toBe("course:course_123:content");
  });

  it("generates correct marketplace key with category", () => {
    expect(cacheKeys.marketplaceList(0, "programming")).toBe(
      "marketplace:programming:0"
    );
  });

  it("generates correct marketplace key without category", () => {
    expect(cacheKeys.marketplaceList(1)).toBe("marketplace:all:1");
  });

  it("generates correct search key", () => {
    expect(cacheKeys.searchResults("react hooks")).toBe("search:react hooks");
  });
});

describe("cacheTTL", () => {
  it("has reasonable TTL values", () => {
    expect(cacheTTL.courseMeta).toBeGreaterThan(0);
    expect(cacheTTL.courseContent).toBeGreaterThan(cacheTTL.courseMeta);
    expect(cacheTTL.marketplace).toBeGreaterThan(0);
    expect(cacheTTL.search).toBeGreaterThan(0);
  });
});