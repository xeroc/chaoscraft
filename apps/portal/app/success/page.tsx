'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'

function LoadingState() {
  return (
    <div className="min-h-screen galaxy-gradient flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4" />
        <p className="text-xl text-white">Processing your payment...</p>
      </div>
    </div>
  )
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [issueNumber, setIssueNumber] = useState<number | null>(null)

  useEffect(() => {
    if (sessionId) {
      // In production, you'd verify the session and get the issue number
      // For now, simulate a delay
      setTimeout(() => {
        setLoading(false)
        // This would be fetched from the backend
        setIssueNumber(142)
      }, 2000)
    }
  }, [sessionId])

  if (loading) {
    return <LoadingState />
  }

  return (
    <div className="min-h-screen galaxy-gradient flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-blue-200/70 mb-6">Your feature request has been submitted to the queue</p>

        {issueNumber && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-300/70 mb-1">Your Request</p>
            <p className="text-2xl font-bold text-white mb-2">Issue #{issueNumber}</p>
            <p className="text-sm text-blue-200/60">Position in queue will be calculated shortly</p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/?view=queue"
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            View Queue
          </Link>

          <Link
            href="/"
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            Submit Another Request
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-sm text-blue-300/70">
            Watch your star be built in real-time at the{' '}
            <a href="https://github.com/repofun/repofun/issues" className="text-blue-400 hover:underline flex items-center justify-center gap-1 mt-2">
              <ExternalLink className="w-3 h-3" />
              GitHub Issue Tracker
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SuccessContent />
    </Suspense>
  )
}
