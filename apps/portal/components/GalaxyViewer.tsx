'use client'

import { useState, useRef, useEffect } from 'react'
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react'

export default function GalaxyViewer() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement)
  }

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const refreshGalaxy = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src
    }
  }

  return (
    <div ref={containerRef} className="relative h-full">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={refreshGalaxy}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg p-2 text-white transition-all"
          title="Refresh Galaxy"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg p-2 text-white transition-all"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Galaxy Iframe */}
      <iframe
        ref={iframeRef}
        src="/galaxy"
        className="w-full h-full border-0"
        title="ChaosCraft Galaxy"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  )
}
