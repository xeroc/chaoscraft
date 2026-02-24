'use client'

import { useEffect, useState } from 'react'
import { Clock, User, GitPullRequest, CheckCircle, Loader } from 'lucide-react'

interface QueueItem {
  id: number
  title: string
  position: number
  status: 'queued' | 'building' | 'completed' | 'failed'
  priority: 'standard' | 'priority' | 'express'
  createdAt: string
  eta?: string
  progress?: {
    step: string
    percentage: number
  }
}

export default function QueueTracker() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const response = await fetch('/api/queue')
        if (response.ok) {
          const data = await response.json()
          setQueue(data.items || [])
        }
      } catch (err) {
        console.error('Failed to fetch queue:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchQueue()
    const interval = setInterval(fetchQueue, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'building':
        return <Loader className="w-4 h-4 animate-spin text-blue-400" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <div className="w-4 h-4 rounded-full bg-red-400" />
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />
    }
  }

  const getStatusColor = (status: QueueItem['status']) => {
    switch (status) {
      case 'building':
        return 'border-blue-500/30 bg-blue-500/5'
      case 'completed':
        return 'border-green-500/30 bg-green-500/5'
      case 'failed':
        return 'border-red-500/30 bg-red-500/5'
      default:
        return 'border-white/10 bg-white/5'
    }
  }

  const getPriorityBadge = (priority: QueueItem['priority']) => {
    switch (priority) {
      case 'express':
        return <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">Express</span>
      case 'priority':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">Priority</span>
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-white mb-1">
            {queue.filter((item) => item.status === 'queued').length}
          </div>
          <div className="text-sm text-blue-300/70">In Queue</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-white mb-1">
            {queue.filter((item) => item.status === 'building').length}
          </div>
          <div className="text-sm text-blue-300/70">Building</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-white mb-1">
            {queue.filter((item) => item.status === 'completed').length}
          </div>
          <div className="text-sm text-blue-300/70">Completed</div>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-3">
        {queue.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Queue is empty</p>
            <p className="text-sm">Be the first to submit a request!</p>
          </div>
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg p-4 ${getStatusColor(item.status)} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(item.status)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">#{item.id}</span>
                    {getPriorityBadge(item.priority)}
                  </div>

                  <p className="text-white mb-2 truncate">{item.title}</p>

                  <div className="flex items-center gap-4 text-sm text-blue-300/70">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      @{item.id % 2 === 0 ? 'user' : 'builder'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                    {item.eta && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ETA: {item.eta}
                      </span>
                    )}
                  </div>

                  {item.status === 'building' && item.progress && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-blue-300/70 mb-1">
                        <span>{item.progress.step}</span>
                        <span>{item.progress.percentage}%</span>
                      </div>
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                          style={{ width: `${item.progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-white">#{item.position}</div>
                  <div className="text-xs text-blue-300/70">Position</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Build Slots Info */}
      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Build Slots</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">
              {queue.filter((item) => item.status === 'building').length}/10
            </div>
            <div className="text-xs text-blue-300/70">This Hour</div>
          </div>
        </div>
        <div className="mt-2 text-sm text-blue-300/70">
          Resets at the top of every hour. Only 10 features built per hour!
        </div>
      </div>
    </div>
  )
}
