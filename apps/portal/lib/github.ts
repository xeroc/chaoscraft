import { execSync } from 'child_process'

// File extension to color category mapping
const FILE_TYPE_COLORS: Record<string, string> = {
  // UI Features (blue)
  '.tsx': 'blue',
  '.jsx': 'blue',
  '.vue': 'blue',
  '.svelte': 'blue',
  '.css': 'blue',
  '.scss': 'blue',
  '.html': 'blue',
  
  // Logic & APIs (green)
  '.ts': 'green',
  '.js': 'green',
  '.mjs': 'green',
  '.cjs': 'green',
  
  // Data & Models (yellow)
  '.json': 'yellow',
  '.yaml': 'yellow',
  '.yml': 'yellow',
  '.xml': 'yellow',
  '.sql': 'yellow',
  '.prisma': 'yellow',
  
  // Infrastructure (purple)
  '.dockerfile': 'purple',
  '.sh': 'purple',
  '.bash': 'purple',
  // '.yml' already mapped to yellow above
  '.toml': 'purple',
  '.ini': 'purple',
  '.env': 'purple',
  
  // Tests (pink)
  '.test.ts': 'pink',
  '.test.js': 'pink',
  '.spec.ts': 'pink',
  '.spec.js': 'pink',
}

// Determine color based on file types
function determineColor(files: string[]): string {
  const colorCounts: Record<string, number> = {
    blue: 0,
    green: 0,
    yellow: 0,
    purple: 0,
    pink: 0,
  }
  
  for (const file of files) {
    const ext = '.' + file.split('.').pop()?.toLowerCase()
    
    // Check for test files first
    if (file.includes('.test.') || file.includes('.spec.')) {
      colorCounts.pink++
      continue
    }
    
    const color = FILE_TYPE_COLORS[ext]
    if (color) {
      colorCounts[color]++
    }
  }
  
  // Return the most common color, default to green
  const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])
  return sorted[0][1] > 0 ? sorted[0][0] : 'green'
}

// Generate deterministic position from a string (e.g., commit hash)
function hashToPosition(hash: string): { x: number; y: number; z: number } {
  // Use first 8 characters of hash for determinism
  const seed = hash.substring(0, 8)
  let num = parseInt(seed, 16)
  
  // Generate pseudo-random but deterministic coordinates
  const x = ((num % 200) - 100) * 0.3  // -30 to 30
  num = Math.floor(num / 7)
  const y = ((num % 200) - 100) * 0.3  // -30 to 30
  num = Math.floor(num / 7)
  const z = ((num % 200) - 100) * 0.3  // -30 to 30
  
  return { x, y, z }
}

// Calculate brightness based on recency (0.5 to 1.0)
function calculateBrightness(mergedAt: string | null): number {
  if (!mergedAt) return 0.6
  
  const merged = new Date(mergedAt).getTime()
  const now = Date.now()
  const ageDays = (now - merged) / (1000 * 60 * 60 * 24)
  
  // Newer = brighter. Decay over 30 days to minimum 0.5
  const brightness = Math.max(0.5, 1.0 - (ageDays / 30) * 0.5)
  return Math.round(brightness * 100) / 100
}

// Calculate star size based on lines changed (capped at 20)
function calculateSize(linesChanged: number): number {
  // Min size 3, max size 20, based on lines changed
  const size = Math.max(3, Math.min(20, Math.floor(linesChanged / 10) + 3))
  return size
}

export interface FileChange {
  path: string
  additions: number
  deletions: number
}

export interface StarData {
  id: number
  issueNumber: number | null
  title: string
  description: string
  position: { x: number; y: number; z: number }
  color: string
  size: number
  brightness: number
  pulse: boolean
  priority: string
  linesChanged: number
  files: number
  commitHash: string
  mergedAt: string | null
  builtBy: string
  prUrl: string | null
  filesChanged: FileChange[]
}

export interface GitHubPR {
  number: number
  title: string
  body: string | null
  mergedAt: string | null
  additions: number
  deletions: number
  changedFiles: number
  files: Array<{ path: string; additions: number; deletions: number }>
  mergeCommit: { oid: string } | null
  author: { login: string } | null
  url: string
}

// Fetch merged PRs from GitHub using gh CLI
export async function fetchMergedPRs(
  owner: string = process.env.GITHUB_OWNER || 'xeroc',
  repo: string = process.env.GITHUB_REPO || 'chaoscraft',
  limit: number = 100
): Promise<GitHubPR[]> {
  try {
    const query = `
      query($owner: String!, $repo: String!, $limit: Int!) {
        repository(owner: $owner, name: $repo) {
          pullRequests(first: $limit, states: [MERGED], orderBy: {field: MERGED_AT, direction: DESC}) {
            nodes {
              number
              title
              body
              mergedAt
              additions
              deletions
              changedFiles
              files(first: 50) {
                nodes {
                  path
                  additions
                  deletions
                }
              }
              mergeCommit {
                oid
              }
              author {
                login
              }
              url
            }
          }
        }
      }
    `

    const result = execSync(
      `gh api graphql -f query='${query}' -f owner=${owner} -f repo=${repo} -f limit=${limit}`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    )
    
    const data = JSON.parse(result)
    const prs = data.data?.repository?.pullRequests?.nodes || []
    
    return prs.map((pr: any) => ({
      number: pr.number,
      title: pr.title,
      body: pr.body,
      mergedAt: pr.mergedAt,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changedFiles,
      files: pr.files?.nodes || [],
      mergeCommit: pr.mergeCommit,
      author: pr.author,
      url: pr.url,
    }))
  } catch (error) {
    console.error('Failed to fetch PRs from GitHub:', error)
    return []
  }
}

// Transform GitHub PR to Star data
export function transformPRToStar(pr: GitHubPR, index: number): StarData {
  const filePaths = pr.files.map(f => f.path)
  const commitHash = pr.mergeCommit?.oid || `hash-${pr.number}`
  
  // Extract issue number from PR body or title (e.g., "Fixes #42" or "#42")
  let issueNumber: number | null = null
  const issueMatch = pr.body?.match(/#(\d+)/) || pr.title.match(/#(\d+)/)
  if (issueMatch) {
    issueNumber = parseInt(issueMatch[1], 10)
  }
  
  // Determine priority from labels (would need to fetch separately, default to standard)
  const priority = 'standard'
  
  // Sort files by total lines changed (descending)
  const filesChanged = [...pr.files].sort((a, b) =>
    (b.additions + b.deletions) - (a.additions + a.deletions)
  )

  return {
    id: index + 1,
    issueNumber,
    title: pr.title,
    description: pr.body?.substring(0, 200) || 'No description provided',
    position: hashToPosition(commitHash),
    color: determineColor(filePaths),
    size: calculateSize(pr.additions + pr.deletions),
    brightness: calculateBrightness(pr.mergedAt),
    pulse: false, // Could be set based on express priority
    priority,
    linesChanged: pr.additions + pr.deletions,
    files: pr.changedFiles,
    commitHash: commitHash.substring(0, 8),
    mergedAt: pr.mergedAt,
    builtBy: pr.author?.login || 'Unknown',
    prUrl: pr.url,
    filesChanged,
  }
}

// Get all stars from merged PRs
export async function getStarsFromGitHub(): Promise<StarData[]> {
  const prs = await fetchMergedPRs()
  return prs.map((pr, index) => transformPRToStar(pr, index))
}
