import { NextResponse } from 'next/server'
import { fetchMergedPRs } from '@/lib/github'

interface Stats {
  total: number
  today: number
  week: number
}

// Calculate stats from merged PRs
function calculateStats(prs: any[]): Stats {
  const now = Date.now()
  const oneDayAgo = now - 1000 * 60 * 60 * 24
  const oneWeekAgo = now - 1000 * 60 * 60 * 24 * 7
  
  let today = 0
  let week = 0
  
  for (const pr of prs) {
    if (!pr.mergedAt) continue
    
    const mergedTime = new Date(pr.mergedAt).getTime()
    
    if (mergedTime >= oneDayAgo) {
      today++
    }
    if (mergedTime >= oneWeekAgo) {
      week++
    }
  }
  
  return {
    total: prs.length,
    today,
    week,
  }
}

// Mock stats fallback
const MOCK_STATS: Stats = {
  total: 9,
  today: 2,
  week: 5,
}

export async function GET() {
  try {
    // Try to fetch real PRs from GitHub
    const prs = await fetchMergedPRs()
    
    // If no real PRs exist, use mock stats
    if (prs.length === 0) {
      console.log('No merged PRs found, using mock stats')
      return NextResponse.json({
        ...MOCK_STATS,
        source: 'mock',
      })
    }
    
    const stats = calculateStats(prs)
    
    return NextResponse.json({
      ...stats,
      source: 'github',
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    
    // Fallback to mock data on error
    return NextResponse.json({
      ...MOCK_STATS,
      source: 'mock',
      error: 'Failed to fetch from GitHub',
    })
  }
}
