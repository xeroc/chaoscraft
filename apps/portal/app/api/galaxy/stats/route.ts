import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

interface Stats {
  stars: number;
  lastFeature: string | null;
  queued: number;
  inProgress: number;
  completed: number;
  lastHour: number;
}

export async function GET() {
  try {
    const totalResult = await queryOne(
      "SELECT COUNT(*) as count FROM requests",
    );
    const stars = 15 + parseInt(totalResult?.count ?? "0");

    const lastFeatureResult = await queryOne(
      "SELECT request_text FROM requests ORDER BY issue_number DESC LIMIT 1",
    );
    const lastFeature = lastFeatureResult?.request_text || null;

    const queuedResult = await queryOne(
      "SELECT COUNT(*) as count FROM requests WHERE status = 'paid'",
    );
    const queued = parseInt(queuedResult?.count || "0");

    const inProgressResult = await queryOne(
      "SELECT COUNT(*) as count FROM requests WHERE status = 'inprogress'",
    );
    const inProgress = parseInt(inProgressResult?.count ?? "0");

    const lastHourResult = await queryOne(
      "SELECT COUNT(*) as count FROM requests WHERE created_at >= NOW() - INTERVAL '1 hour'",
    );
    const lastHour = parseInt(lastHourResult?.count ?? "0");

    return NextResponse.json({
      stars,
      lastFeature,
      queued,
      inProgress,
      completed: stars,
      lastHour,
      source: "database",
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);

    return NextResponse.json({
      stars: 0,
      lastFeature: null,
      queued: 0,
      inProgress: 0,
      completed: 0,
      lastHour: 0,
      source: "error",
      error: "Failed to fetch from database",
    });
  }
}
