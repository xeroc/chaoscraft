import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Octokit } from 'octokit'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

// Fetch GitHub issues with relevant labels
async function fetchGitHubIssues() {
  try {
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      labels: 'awaiting-payment,ready-for-build,building,completed',
      state: 'open',
      sort: 'created',
      direction: 'asc',
      per_page: 100,
    })

    return issues
  } catch (error) {
    console.error('Failed to fetch GitHub issues:', error)
    return []
  }
}

// Calculate ETA based on queue position
function calculateETA(position: number, buildsPerHour: number = 10): string {
  const hours = Math.ceil(position / buildsPerHour)

  if (hours < 1) {
    return '< 1 hour'
  } else if (hours === 1) {
    return '~1 hour'
  } else if (hours < 24) {
    return `~${hours} hours`
  } else {
    const days = Math.ceil(hours / 24)
    return `~${days} days`
  }
}

// Get build progress from AntFarm SQLite DB (if available)
async function getBuildProgress(issueNumber: number): Promise<{ step: string; percentage: number } | null> {
  try {
    // This would query AntFarm SQLite DB on Raspberry Pi
    // For now, return null as we haven't set up connection yet
    return null
  } catch (error) {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    // Fetch GitHub issues
    const githubIssues = await fetchGitHubIssues()

    // Process issues and merge with payment data
    const items = await Promise.all(
      githubIssues.map(async (issue) => {
        const labels = issue.labels.map((label) => typeof label === 'string' ? label : (label?.name || ''))

        // Determine status from labels
        let status: 'queued' | 'building' | 'completed' | 'failed' = 'queued'

        if (labels.includes('completed')) {
          status = 'completed'
        } else if (labels.includes('building')) {
          status = 'building'
        } else if (labels.includes('ready-for-build')) {
          status = 'queued'
        } else if (labels.includes('failed')) {
          status = 'failed'
        }

        // Determine priority from labels
        let priority: 'standard' | 'priority' | 'express' = 'standard'

        if (labels.includes('priority:express')) {
          priority = 'express'
        } else if (labels.includes('priority')) {
          priority = 'priority'
        }

        // Calculate position (simplified - in production, you'd sort by priority)
        const position = issue.number

        // Get build progress if building
        let progress: { step: string; percentage: number } | undefined

        if (status === 'building') {
          const buildProgress = await getBuildProgress(issue.number)
          if (buildProgress) {
            progress = buildProgress
          } else {
            // Default progress for building items
            progress = { step: 'Building feature...', percentage: 50 }
          }
        }

        return {
          id: issue.number,
          title: issue.title,
          position,
          status,
          priority,
          createdAt: issue.created_at,
          eta: status === 'queued' ? calculateETA(position) : undefined,
          progress,
        }
      })
    )

    // Sort by priority and position
    const priorityOrder = { express: 0, priority: 1, standard: 2 }

    items.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]

      if (priorityDiff !== 0) {
        return priorityDiff
      }

      return a.position - b.position
    })

    // Recalculate positions after sorting
    items.forEach((item, index) => {
      item.position = index + 1
    })

    return NextResponse.json({
      items,
      total: items.length,
      queued: items.filter((item) => item.status === 'queued').length,
      building: items.filter((item) => item.status === 'building').length,
      completed: items.filter((item) => item.status === 'completed').length,
      failed: items.filter((item) => item.status === 'failed').length,
    })
  } catch (error) {
    console.error('Queue API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
