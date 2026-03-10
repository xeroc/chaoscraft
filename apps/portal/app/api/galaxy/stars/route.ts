import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query(`
      SELECT 
        issue_number,
        request_text,
        commit,
        created_at
      FROM requests
      WHERE status = 'completed'
      ORDER BY created_at DESC
    `);

    const stars = rows
      .filter((row) => row.commit != null && row.issue_number != null)
      .map((row) => ({
        issueNumber: row.issue_number,
        description: row.request_text,
        commit: row.commit,
        createdAt: row.created_at,
      }));

    return NextResponse.json({
      stars,
    });
  } catch (error) {
    console.error("Failed to fetch stars:", error);
    return NextResponse.json(
      {
        stars: [],
        error: "Failed to fetch from database",
      },
      { status: 500 },
    );
  }
}
