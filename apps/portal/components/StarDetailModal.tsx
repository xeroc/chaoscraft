interface StarData {
  issueNumber: number;
  description: string;
  commit: string;
  createdAt: string;
}

interface StarDetailModalProps {
  star: StarData;
  onClose: () => void;
}

export default function StarDetailModal({
  star,
  onClose,
}: StarDetailModalProps) {
  return (
    <div
      className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white/10 border border-white/20 rounded-xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">
              Issue #{star.issueNumber}
            </h3>
            <a
              href={`https://github.com/xeroc/chaoscraft/issues/${star.issueNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 text-sm transition-colors bg-blue-500/10 px-3 py-2 rounded-lg"
            >
              View on GitHub
              <svg
                className="w-4 h-4"
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
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl ml-4"
          >
            &times;
          </button>
        </div>

        <div className="mb-4">
          <div className="text-blue-300/70 mb-1">Description</div>
          <p className="text-white/90">{star.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-blue-300/70 mb-1">Created</div>
            <div className="text-white">
              {new Date(star.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-blue-300/70 mb-1">Commit</div>
            <a
              href={`https://github.com/xeroc/chaoscraft/commit/${star.commit}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-300 font-mono text-xs transition-colors inline-flex items-center gap-1"
            >
              {star.commit.substring(0, 7)}
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
          </div>
        </div>
      </div>
    </div>
  );
}
