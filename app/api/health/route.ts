import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { CourseList } from "@/server/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {};
  const startTime = Date.now();

  // Database check
  try {
    const dbStart = Date.now();
    await db.select({ count: sql`count(*)` }).from(CourseList);
    checks.database = {
      status: "healthy",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: "unhealthy",
    };
  }

  // Overall status
  const allHealthy = Object.values(checks).every((c) => c.status === "healthy");

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      version: process.env.npm_package_version || "unknown",
    },
    {
      status: allHealthy ? 200 : 503,
    }
  );
}
