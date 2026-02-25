import { useState } from 'react'

interface FileChange {
  path: string
  additions: number
  deletions: number
}

interface StarData {
  id: number
  issueNumber: number | null
  title: string
  description: string
  position: { x: number; y: number; z: number }
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'pink'
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

interface StarDetailModalProps {
  star: StarData
  onClose: () => void
}

export default function StarDetailModal({ star, onClose }: StarDetailModalProps) {
  const [showAllFiles, setShowAllFiles] = useState(false)

  return (
    <div
      className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-white/10 border border-white/20 rounded-xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {/* PR Title displayed prominently */}
            <h3 className="text-2xl font-bold text-white mb-1 leading-tight">
              {star.title}
            </h3>
            {/* Issue number with link if available */}
            {star.issueNumber ? (
              <a
                href={`https://github.com/xeroc/chaoscraft/issues/${star.issueNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 text-sm transition-colors"
              >
                #{star.issueNumber}
              </a>
            ) : (
              <span className="text-blue-300/70 text-sm">No linked issue</span>
            )}
            <p className="text-blue-200/70 mt-2">{star.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl ml-4"
          >
            &times;
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-blue-300/70 mb-1">Built By</div>
            <div className="text-white font-semibold">{star.builtBy}</div>
          </div>
          <div>
            <div className="text-blue-300/70 mb-1">Files Changed</div>
            <div className="text-white font-semibold">{star.files}</div>
          </div>
          <div>
            <div className="text-blue-300/70 mb-1">Lines Changed</div>
            <div className="text-white font-semibold">{star.linesChanged}</div>
          </div>
          <div>
            <div className="text-blue-300/70 mb-1">Priority</div>
            <div className="text-white font-semibold capitalize">{star.priority}</div>
          </div>
        </div>
        {/* Commit link */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-blue-300/70 mb-1">Commit</div>
          {star.commitHash ? (
            <a
              href={`https://github.com/xeroc/chaoscraft/commit/${star.commitHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-300 font-mono text-sm transition-colors inline-flex items-center gap-1"
            >
              {star.commitHash}
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          ) : (
            <span className="text-white/50 text-sm">No commit hash</span>
          )}
        </div>
        {star.mergedAt && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-blue-300/70 mb-1">Merged At</div>
            <div className="text-white">
              {new Date(star.mergedAt).toLocaleString()}
            </div>
          </div>
        )}
        {/* Files Changed List */}
        {star.filesChanged && star.filesChanged.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-2">
              <div className="text-blue-300/70">Files Changed</div>
              {star.prUrl && (
                <a
                  href={star.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-300 hover:text-blue-200 transition-colors inline-flex items-center gap-1"
                >
                  View on GitHub
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {(showAllFiles ? star.filesChanged : star.filesChanged.slice(0, 10)).map((file, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-xs py-1 px-2 rounded bg-white/5"
                >
                  <span className="text-white/80 truncate flex-1 mr-2" title={file.path}>
                    {file.path}
                  </span>
                  <span className="flex-shrink-0 flex gap-2">
                    <span className="text-green-400">+{file.additions}</span>
                    <span className="text-red-400">-{file.deletions}</span>
                  </span>
                </div>
              ))}
            </div>
            {star.filesChanged.length > 10 && (
              <button
                onClick={() => setShowAllFiles(!showAllFiles)}
                className="mt-2 text-xs text-blue-300 hover:text-blue-200 transition-colors w-full text-center py-1"
              >
                {showAllFiles
                  ? 'Show less'
                  : `Show ${star.filesChanged.length - 10} more files`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
