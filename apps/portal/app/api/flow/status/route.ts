import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const rows = await query(
      `SELECT id, timestamp, method_name, state_json FROM flow_states ORDER BY id DESC LIMIT 3`,
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "No flow states found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      rows.map((row) => {
        const { issue_id, task, stories } = row.state_json;
        return {
          id: row.id,
          issue_id,
          method: row.method_name,
          updatedAt: row.timestamp,
          stories,
          task,
        };
      }),
    );
  } catch (error) {
    console.error("Flow status API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
