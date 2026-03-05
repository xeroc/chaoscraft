import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

interface Stats {
  stars: number;
  lastFeature: string | null;
  queue: number;
}

export async function GET() {
  try {
    // Get total number of payments (stars)
    const totalResult = await queryOne(
      "SELECT COUNT(*) as count FROM requests",
    );
    const stars = totalResult?.count || 0;

    // Get the item with the highest issue number (last feature)
    const lastFeatureResult = await queryOne(
      "SELECT request_text FROM requests ORDER BY issue_number DESC LIMIT 1",
    );
    const lastFeature = lastFeatureResult?.request_text || null;

    // Get count of payments with status='paid' (queue)
    const queueResult = await queryOne(
      "SELECT COUNT(*) as count FROM requests WHERE status = 'paid'",
    );
    const queue = queueResult?.count || 0;

    return NextResponse.json({
      stars,
      lastFeature,
      queue,
      source: "database",
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);

    return NextResponse.json({
      stars: 0,
      lastFeature: null,
      queue: 0,
      source: "error",
      error: "Failed to fetch from database",
    });
  }
}
