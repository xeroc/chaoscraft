import { NextResponse } from 'next/server'

// Mock stats - will be replaced with actual data from database/API later
const MOCK_STATS = {
  total: 142,
  today: 12,
  week: 45,
}

export async function GET() {
  return NextResponse.json(MOCK_STATS)
}
