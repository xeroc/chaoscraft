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
    commitHash: "abc12345",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
    builtBy: "user1",
    prUrl: "https://github.com/xeroc/chaoscraft/pull/1",
    filesChanged: [
      { path: "apps/portal/components/LoginForm.tsx", additions: 45, deletions: 0 },
      { path: "apps/portal/lib/auth.ts", additions: 28, deletions: 5 },
      { path: "apps/portal/styles/login.css", additions: 15, deletions: 0 },
    ],
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
    commitHash: "def45678",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    builtBy: "user2",
    prUrl: "https://github.com/xeroc/chaoscraft/pull/2",
    filesChanged: [
      { path: "apps/portal/components/ThemeToggle.tsx", additions: 32, deletions: 0 },
      { path: "apps/portal/hooks/useTheme.ts", additions: 10, deletions: 0 },
    ],
  },
  {
    id: 3,
    issueNumber: null,
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
    commitHash: "ghi78901",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    builtBy: "user3",
    prUrl: null,
    filesChanged: [
      { path: "apps/portal/app/profile/page.tsx", additions: 58, deletions: 0 },
      { path: "apps/portal/components/ProfileCard.tsx", additions: 42, deletions: 0 },
      { path: "apps/portal/components/UserSettings.tsx", additions: 35, deletions: 3 },
      { path: "apps/portal/lib/user.ts", additions: 18, deletions: 2 },
      { path: "apps/portal/styles/profile.css", additions: 20, deletions: 0 },
    ],
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
    commitHash: "jkl01234",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    builtBy: "user1",
    prUrl: "https://github.com/xeroc/chaoscraft/pull/4",
    filesChanged: [
      { path: "apps/portal/app/reset-password/page.tsx", additions: 38, deletions: 0 },
      { path: "apps/portal/lib/email.ts", additions: 32, deletions: 0 },
      { path: "apps/portal/api/reset-password/route.ts", additions: 22, deletions: 0 },
      { path: "apps/portal/components/ResetForm.tsx", additions: 18, deletions: 0 },
    ],
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
    commitHash: "mno34567",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
    builtBy: "user4",
    prUrl: "https://github.com/xeroc/chaoscraft/pull/5",
    filesChanged: [
      { path: "apps/portal/middleware/rateLimit.ts", additions: 45, deletions: 0 },
      { path: "apps/portal/config/limits.json", additions: 12, deletions: 0 },
    ],
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
    commitHash: "a1b2c3d4",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    builtBy: "Claude",
    prUrl: "https://github.com/xeroc/chaoscraft/pull/42",
    filesChanged: [
      { path: "apps/portal/components/ThemeToggle.tsx", additions: 28, deletions: 5 },
      { path: "apps/portal/styles/theme.css", additions: 22, deletions: 0 },
      { path: "apps/portal/hooks/useTheme.ts", additions: 15, deletions: 2 },
      { path: "apps/portal/app/layout.tsx", additions: 8, deletions: 1 },
      { path: "apps/portal/components/Header.tsx", additions: 5, deletions: 0 },
      { path: "apps/portal/lib/theme.ts", additions: 4, deletions: 0 },
      { path: "apps/portal/types/theme.ts", additions: 3, deletions: 0 },
      { path: "apps/portal/__tests__/theme.test.ts", additions: 15, deletions: 0 },
      { path: "apps/portal/config/themes.json", additions: 8, deletions: 0 },
    ],
  },
  {
    id: 7,
    issueNumber: null,
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
    commitHash: "m0n1o2p3",
    mergedAt: null,
    builtBy: "Claude",
    prUrl: null,
    filesChanged: [
      { path: "apps/portal/api/auth/route.ts", additions: 3, deletions: 0 },
      { path: "apps/portal/lib/session.ts", additions: 1, deletions: 0 },
      { path: "apps/portal/middleware/auth.ts", additions: 1, deletions: 0 },
    ],
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
    commitHash: "q3r4s5t6",
    mergedAt: null,
    builtBy: "Claude",
    prUrl: "https://github.com/xeroc/chaoscraft/pull/44",
    filesChanged: [
      { path: "apps/portal/api/payments/route.ts", additions: 2, deletions: 0 },
      { path: "apps/portal/lib/stripe.ts", additions: 2, deletions: 0 },
      { path: "apps/portal/components/PaymentForm.tsx", additions: 1, deletions: 0 },
      { path: "apps/portal/components/CheckoutButton.tsx", additions: 1, deletions: 0 },
      { path: "apps/portal/hooks/usePayment.ts", additions: 1, deletions: 0 },
      { path: "apps/portal/types/payment.ts", additions: 1, deletions: 0 },
      { path: "apps/portal/config/stripe.ts", additions: 1, deletions: 0 },
      { path: "apps/portal/webhooks/stripe.ts", additions: 1, deletions: 0 },
      { path: "apps/portal/__tests__/payment.test.ts", additions: 1, deletions: 0 },
      { path: "apps/portal/styles/payment.css", additions: 1, deletions: 0 },
    ],
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
    commitHash: "y9z0a1b2",
    mergedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days ago
    builtBy: "Claude",
    prUrl: "https://github.com/xeroc/chaoscraft/pull/45",
    filesChanged: [
      { path: "apps/portal/api/websocket/route.ts", additions: 2, deletions: 0 },
      { path: "apps/portal/hooks/useWebSocket.ts", additions: 2, deletions: 0 },
      { path: "apps/portal/components/QueueStatus.tsx", additions: 1, deletions: 0 },
      { path: "apps/portal/components/BuildProgress.tsx", additions: 1, deletions: 0 },
      { path: "apps/portal/lib/queue.ts", additions: 1, deletions: 0 },
      { path: "apps/portal/types/websocket.ts", additions: 1, deletions: 0 },
      { path: "apps/portal/__tests__/queue.test.ts", additions: 1, deletions: 0 },
      { path: "apps/portal/styles/queue.css", additions: 1, deletions: 0 },
    ],
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
