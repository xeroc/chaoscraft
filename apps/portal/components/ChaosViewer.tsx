'use client'

import { Hammer, GitCommit, GitPullRequest, Code2, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Commit {
  id: string
  message: string
  author: string
  timestamp: string
  hash: string
  filesChanged: number
}

interface Feature {
  id: number
  issueNumber: number
  title: string
  description: string
  commits: Commit[]
  status: 'in-progress' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
}

export default function ForgeViewer() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  useEffect(() => {
    // Load mock data
    loadMockData()
  }, [])

  const loadMockData = () => {
    const mockFeatures: Feature[] = [
      {
        id: 1,
        issueNumber: 42,
        title: "Add dark mode toggle",
        description: "Users can switch between light and dark themes with persistent preference",
        status: 'completed',
        startedAt: '2024-02-19T10:30:00Z',
        completedAt: '2024-02-19T11:45:00Z',
        commits: [
          {
            id: '1',
            message: 'feat: add dark mode toggle component',
            author: 'Claude',
            timestamp: '2024-02-19T10:45:00Z',
            hash: 'a1b2c3d',
            filesChanged: 3
          },
          {
            id: '2',
            message: 'fix: persist theme preference in localStorage',
            author: 'Claude',
            timestamp: '2024-02-19T11:15:00Z',
            hash: 'e4f5g6h',
            filesChanged: 2
          },
          {
            id: '3',
            message: 'chore: add theme toggle animations',
            author: 'Claude',
            timestamp: '2024-02-19T11:30:00Z',
            hash: 'i7j8k9l',
            filesChanged: 4
          }
        ]
      },
      {
        id: 2,
        issueNumber: 43,
        title: "Implement user authentication",
        description: "Add email/password login with JWT tokens and session management",
        status: 'in-progress',
        startedAt: '2024-02-19T12:00:00Z',
        commits: [
          {
            id: '4',
            message: 'feat: add authentication API endpoints',
            author: 'Claude',
            timestamp: '2024-02-19T12:30:00Z',
            hash: 'm0n1o2p',
            filesChanged: 5
          }
        ]
      },
      {
        id: 3,
        issueNumber: 44,
        title: "Create payment integration",
        description: "Integrate Stripe for $1 payments on feature requests",
        status: 'in-progress',
        startedAt: '2024-02-19T13:00:00Z',
        commits: [
          {
            id: '5',
            message: 'feat: add Stripe checkout session',
            author: 'Claude',
            timestamp: '2024-02-19T13:15:00Z',
            hash: 'q3r4s5t',
            filesChanged: 4
          },
          {
            id: '6',
            message: 'feat: implement webhook handler',
            author: 'Claude',
            timestamp: '2024-02-19T13:45:00Z',
            hash: 'u6v7w8x',
            filesChanged: 6
          }
        ]
      },
      {
        id: 4,
        issueNumber: 45,
        title: "Add real-time queue tracking",
        description: "Live updates of build queue with WebSocket connections",
        status: 'completed',
        startedAt: '2024-02-19T09:00:00Z',
        completedAt: '2024-02-19T10:00:00Z',
        commits: [
          {
            id: '7',
            message: 'feat: add WebSocket server for real-time updates',
            author: 'Claude',
            timestamp: '2024-02-19T09:15:00Z',
            hash: 'y9z0a1b',
            filesChanged: 3
          },
          {
            id: '8',
            message: 'feat: implement queue tracking component',
            author: 'Claude',
            timestamp: '2024-02-19T09:45:00Z',
            hash: 'c2d3e4f',
            filesChanged: 5
          }
        ]
      }
    ]

    setFeatures(mockFeatures)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getStatusColor = (status: Feature['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'in-progress':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-400/30'
    }
  }

  const getStatusIcon = (status: Feature['status']) => {
    switch (status) {
      case 'completed':
        return <GitPullRequest className="w-4 h-4" />
      case 'in-progress':
        return <Code2 className="w-4 h-4" />
      case 'failed':
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Feature List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-4xl">🔨</div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              The Forge
            </h2>
            <p className="text-sm text-blue-200/70">Watch features take shape</p>
          </div>
        </div>

        {features.map((feature) => (
          <div
            key={feature.id}
            onClick={() => setSelectedFeature(feature)}
            className={`p-4 rounded-xl cursor-pointer transition-all border ${
              selectedFeature?.id === feature.id
                ? 'bg-blue-500/20 border-blue-400/30'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-300/70 font-mono">#{feature.issueNumber}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border ${getStatusColor(feature.status)}`}
                >
                  {getStatusIcon(feature.status)}
                  <span className="capitalize">{feature.status.replace('-', ' ')}</span>
                </span>
              </div>
              <span className="text-xs text-blue-300/50">{formatDate(feature.startedAt)}</span>
            </div>
            <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
            <p className="text-sm text-blue-200/60 line-clamp-2">{feature.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-blue-300/50">
              <div className="flex items-center gap-1">
                <GitCommit className="w-3 h-3" />
                <span>{feature.commits.length} commits</span>
              </div>
              <div className="flex items-center gap-1">
                <Hammer className="w-3 h-3" />
                <span>{feature.commits.reduce((sum, c) => sum + c.filesChanged, 0)} files</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Commit History */}
      <div className="lg:col-span-2">
        {selectedFeature ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-blue-300/70 font-mono">#{selectedFeature.issueNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border ${getStatusColor(selectedFeature.status)}`}
                  >
                    {getStatusIcon(selectedFeature.status)}
                    <span className="capitalize">{selectedFeature.status.replace('-', ' ')}</span>
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{selectedFeature.title}</h3>
                <p className="text-blue-200/70">{selectedFeature.description}</p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <GitCommit className="w-4 h-4" />
                Commit History
              </h4>

              <div className="space-y-4">
                {selectedFeature.commits.map((commit, index) => (
                  <div key={commit.id} className="relative pl-6">
                    {index !== selectedFeature.commits.length - 1 && (
                      <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gradient-to-b from-blue-400/50 to-transparent" />
                    )}
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-400/30" />

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-blue-300/70 font-mono bg-blue-500/10 px-2 py-0.5 rounded">
                            {commit.hash}
                          </code>
                          <span className="text-sm text-blue-200/60">{formatDate(commit.timestamp)}</span>
                        </div>
                        <span className="text-xs text-blue-300/50 flex items-center gap-1">
                          <Code2 className="w-3 h-3" />
                          {commit.filesChanged} files
                        </span>
                      </div>
                      <p className="text-white text-sm mb-2">{commit.message}</p>
                      <div className="text-xs text-blue-200/50">Authored by {commit.author}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedFeature.completedAt && (
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                <span className="text-blue-200/70">
                  Started: {new Date(selectedFeature.startedAt).toLocaleString()}
                </span>
                <span className="text-green-400 flex items-center gap-1">
                  <GitPullRequest className="w-4 h-4" />
                  Completed: {new Date(selectedFeature.completedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <Hammer className="w-16 h-16 text-blue-400/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Select a Feature</h3>
            <p className="text-blue-200/60">Click on a feature from the list to view its commit history and build progress.</p>
          </div>
        )}
      </div>
    </div>
  )
}
