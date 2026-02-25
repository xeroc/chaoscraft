import { NextResponse } from 'next/server'
import { getStarsFromGitHub, StarData } from '@/lib/github'

// Mock data - used as fallback when no real PRs exist
const MOCK_STAR_DATA: StarData[] = [
  {
    id: 1,
    issueNumber: 1,
    title: "Add login form",
    description: "User authentication with email and password",
    position: { x: 10, y: 20, z: 5 },
    color: "blue",
    size: 8,
    brightness: 1.0,
    pulse: false,
    priority: "standard",
    linesChanged: 78,
    files: 3,
    commitHash: "abc123",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
    builtBy: "user1",
    prUrl: null,
  },
  {
    id: 2,
    issueNumber: 2,
    title: "Add dark mode toggle",
    description: "Switch between light and dark themes",
    position: { x: -15, y: 10, z: -8 },
    color: "blue",
    size: 5,
    brightness: 0.9,
    pulse: false,
    priority: "standard",
    linesChanged: 42,
    files: 2,
    commitHash: "def456",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    builtBy: "user2",
    prUrl: null,
  },
  {
    id: 3,
    issueNumber: 3,
    title: "Add user profile page",
    description: "Display user information and settings",
    position: { x: 5, y: -12, z: 15 },
    color: "blue",
    size: 12,
    brightness: 0.95,
    pulse: true,
    priority: "express",
    linesChanged: 156,
    files: 5,
    commitHash: "ghi789",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    builtBy: "user3",
    prUrl: null,
  },
  {
    id: 4,
    issueNumber: 4,
    title: "Add password reset",
    description: "Email-based password recovery",
    position: { x: -8, y: 25, z: -3 },
    color: "green",
    size: 10,
    brightness: 0.85,
    pulse: false,
    priority: "priority",
    linesChanged: 98,
    files: 4,
    commitHash: "jkl012",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    builtBy: "user1",
    prUrl: null,
  },
  {
    id: 5,
    issueNumber: 5,
    title: "Add API rate limiting",
    description: "Prevent abuse with request throttling",
    position: { x: 20, y: -5, z: -12 },
    color: "purple",
    size: 7,
    brightness: 0.8,
    pulse: false,
    priority: "standard",
    linesChanged: 65,
    files: 2,
    commitHash: "mno345",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    builtBy: "user4",
    prUrl: null,
  },
  {
    id: 6,
    issueNumber: 42,
    title: "Add dark mode toggle",
    description: "Users can switch between light and dark themes with persistent preference",
    position: { x: -10, y: -15, z: 20 },
    color: "blue",
    size: 14,
    brightness: 0.9,
    pulse: true,
    priority: "express",
    linesChanged: 89,
    files: 9,
    commitHash: "a1b2c3d",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    builtBy: "Claude",
    prUrl: null,
  },
  {
    id: 7,
    issueNumber: 43,
    title: "Implement user authentication",
    description: "Add email/password login with JWT tokens and session management",
    position: { x: 15, y: 10, z: -15 },
    color: "green",
    size: 11,
    brightness: 0.85,
    pulse: false,
    priority: "priority",
    linesChanged: 5,
    files: 3,
    commitHash: "m0n1o2p",
    mergedAt: null,
    builtBy: "Claude",
    prUrl: null,
  },
  {
    id: 8,
    issueNumber: 44,
    title: "Create payment integration",
    description: "Integrate Stripe for $1 payments on feature requests",
    position: { x: -20, y: 5, z: 10 },
    color: "purple",
    size: 13,
    brightness: 0.88,
    pulse: false,
    priority: "priority",
    linesChanged: 10,
    files: 10,
    commitHash: "q3r4s5t",
    mergedAt: null,
    builtBy: "Claude",
    prUrl: null,
  },
  {
    id: 9,
    issueNumber: 45,
    title: "Add real-time queue tracking",
    description: "Live updates of build queue with WebSocket connections",
    position: { x: 0, y: -20, z: 0 },
    color: "blue",
    size: 9,
    brightness: 0.92,
    pulse: false,
    priority: "standard",
    linesChanged: 8,
    files: 8,
    commitHash: "y9z0a1b",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days ago
    builtBy: "Claude",
    prUrl: null,
  },
]

const COLOR_MAPPINGS = {
  blue: "#3b82f6",    // UI Features
  green: "#22c55e",   // Logic & APIs
  yellow: "#eab308",  // Data & Models
  purple: "#a855f7",  // Infrastructure
  pink: "#ec4899",    // Tests
}

export async function GET() {
  try {
    // Try to fetch real stars from GitHub
    const stars = await getStarsFromGitHub()
    
    // If no real PRs exist, use mock data
    if (stars.length === 0) {
      console.log('No merged PRs found, using mock data')
      return NextResponse.json({
        stars: MOCK_STAR_DATA,
        colorMappings: COLOR_MAPPINGS,
        source: 'mock',
      })
    }
    
    return NextResponse.json({
      stars,
      colorMappings: COLOR_MAPPINGS,
      source: 'github',
    })
  } catch (error) {
    console.error('Failed to fetch stars:', error)
    
    // Fallback to mock data on error
    return NextResponse.json({
      stars: MOCK_STAR_DATA,
      colorMappings: COLOR_MAPPINGS,
      source: 'mock',
      error: 'Failed to fetch from GitHub',
    })
  }
}
