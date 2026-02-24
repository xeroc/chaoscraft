// Shared types and utilities for repo.fun

export interface FeatureRequest {
  id: number
  requestText: string
  priority: 'standard' | 'priority' | 'express'
  status: 'queued' | 'building' | 'completed' | 'failed'
  createdAt: string
}

export interface Payment {
  id: number
  issueNumber: number
  paymentId: string
  amount: number
  currency: string
  paymentMethod: 'stripe' | 'solana'
  priority: string
  status: 'pending' | 'verified' | 'expired' | 'failed'
  createdAt: string
  verifiedAt?: string
}

export interface StarData {
  id: number
  issueNumber: number
  title: string
  description: string
  position: { x: number; y: number; z: number }
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'pink'
  size: number
  brightness: number
  pulse: boolean
  priority: 'standard' | 'priority' | 'express'
  linesChanged: number
  files: number
  commitHash: string
  mergedAt: string
  builtBy: string
}

// Pricing constants
export const PRICING = {
  standard: 1,    // $1
  priority: 5,    // $5
  express: 10,   // $10
} as const

export const BUILD_LIMITS = {
  buildsPerHour: 10,
  maxStoriesPerFeature: 20,
  maxRequestLength: 120,
} as const
