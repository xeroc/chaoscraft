'use client'

import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react'

interface StarData {
  id: number
  issueNumber: number
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
}

export default function GalaxyViewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [starData, setStarData] = useState<StarData[]>([])
  const [stats, setStats] = useState({ total: 0, today: 0, week: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedStar, setSelectedStar] = useState<StarData | null>(null)

  // Three.js refs
  const sceneRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const rendererRef = useRef<any>(null)
  const animationRef = useRef<number>()
  const starsRef = useRef<any>([])

  // Raycaster refs
  const raycasterRef = useRef<any>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  const CONFIG = {
    cameraDistance: 150,
    minDistance: 20,
    maxDistance: 300,
    rotationSpeed: 0.0005,
  }

  // Fetch star data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [starsRes, statsRes] = await Promise.all([
          fetch('/api/galaxy/stars'),
          fetch('/api/galaxy/stats'),
        ])

        const starsData = await starsRes.json()
        const statsData = await statsRes.json()

        setStarData(starsData.stars || [])
        setStats(statsData)
      } catch (error) {
        console.error('Failed to fetch galaxy data:', error)
      }
    }

    fetchData()
  }, [])

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || starData.length === 0) return

    // Load Three.js dynamically
    const loadThreeJS = async () => {
      const THREE = await import('three')

      // Scene
      const scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0x000000, 0.002)
      sceneRef.current = scene

      // Camera
      const camera = new THREE.PerspectiveCamera(
        60,
        containerRef.current!.clientWidth / containerRef.current!.clientHeight,
        0.1,
        1000
      )
      camera.position.set(0, 0, CONFIG.cameraDistance)
      cameraRef.current = camera

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(
        containerRef.current!.clientWidth,
        containerRef.current!.clientHeight
      )
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      rendererRef.current = renderer

      containerRef.current!.appendChild(renderer.domElement)

      // Create stars
      createStars(THREE, scene)

      // Add background particles
      createBackgroundParticles(THREE, scene)

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
      scene.add(ambientLight)

      // Add point light
      const pointLight = new THREE.PointLight(0xffffff, 1, 500)
      pointLight.position.set(0, 0, 0)
      scene.add(pointLight)

      // Initialize raycaster
      const raycaster = new THREE.Raycaster()
      raycaster.params.Points.threshold = 2
      raycasterRef.current = raycaster

      // Setup mouse controls
      setupControls(THREE, renderer.domElement, camera, scene)

      // Setup click detection
      setupClickDetection(THREE, renderer.domElement, camera, scene)

      // Start animation
      animate(THREE, scene, camera, renderer)
    }

    loadThreeJS()

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (containerRef.current && rendererRef.current.domElement) {
          containerRef.current.removeChild(rendererRef.current.domElement)
        }
      }
      // Dispose of star meshes and their geometries/materials
      starsRef.current.forEach((mesh: any) => {
        if (mesh && mesh.geometry) {
          mesh.geometry.dispose()
        }
        if (mesh && mesh.material) {
          mesh.material.dispose()
        }
      })
      starsRef.current = []
    }
  }, [starData])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return

      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight

      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const createStars = (THREE: any, scene: any) => {
    if (starData.length === 0) return

    const COLOR_MAPPINGS = {
      blue: 0x3b82f6,
      green: 0x22c55e,
      yellow: 0xeab308,
      purple: 0xa855f7,
      pink: 0xec4899,
    }

    // Create individual mesh objects for each star
    starData.forEach((starDataItem) => {
      const { x, y, z } = starDataItem.position

      // Create sphere geometry for the star
      const geometry = new THREE.SphereGeometry(starDataItem.size * 0.5, 8, 8)

      // Create material with star color and transparency
      const material = new THREE.MeshBasicMaterial({
        color: COLOR_MAPPINGS[starDataItem.color] || 0xffffff,
        transparent: true,
        opacity: starDataItem.brightness,
        blending: THREE.AdditiveBlending,
      })

      // Create mesh
      const starMesh = new THREE.Mesh(geometry, material)
      starMesh.position.set(x, y, z)

      // Store star metadata in userData for raycasting
      starMesh.userData = {
        id: starDataItem.id,
        issueNumber: starDataItem.issueNumber,
        title: starDataItem.title,
        description: starDataItem.description,
        color: starDataItem.color,
        size: starDataItem.size,
        brightness: starDataItem.brightness,
        priority: starDataItem.priority,
        linesChanged: starDataItem.linesChanged,
        files: starDataItem.files,
        commitHash: starDataItem.commitHash,
        mergedAt: starDataItem.mergedAt,
        builtBy: starDataItem.builtBy,
      }

      // Add to scene
      scene.add(starMesh)

      // Store in starsRef for raycasting
      starsRef.current.push(starMesh)

      // Add glowing effect for larger stars (using a larger, transparent sphere)
      if (starDataItem.size > 2) {
        const glowGeometry = new THREE.SphereGeometry(starDataItem.size * 0.8, 8, 8)
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: COLOR_MAPPINGS[starDataItem.color] || 0xffffff,
          transparent: true,
          opacity: starDataItem.brightness * 0.3,
          blending: THREE.AdditiveBlending,
        })
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
        glowMesh.position.set(x, y, z)
        glowMesh.userData = starMesh.userData // Copy metadata
        scene.add(glowMesh)
        starsRef.current.push(glowMesh)
      }
    })
  }

  const createBackgroundParticles = (THREE: any, scene: any) => {
    const particleCount = 2000
    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 500
      const y = (Math.random() - 0.5) * 500
      const z = (Math.random() - 0.5) * 500
      positions.push(x, y, z)
    }

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    )

    const material = new THREE.PointsMaterial({
      size: 0.5,
      color: 0x888888,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)
    starsRef.current.push(particles)
  }

  const setupControls = (
    THREE: any,
    domElement: HTMLElement,
    camera: any,
    scene: any
  ) => {
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }

    domElement.addEventListener('mousedown', (e: MouseEvent) => {
      isDragging = true
      previousMousePosition = { x: e.clientX, y: e.clientY }
    })

    domElement.addEventListener('mousemove', (e: MouseEvent) => {
      // Update mouse position for raycasting (normalized device coordinates)
      const rect = domElement.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      mouseRef.current = { x, y }

      if (!isDragging) return

      const deltaX = e.clientX - previousMousePosition.x
      const deltaY = e.clientY - previousMousePosition.y

      scene.rotation.y += deltaX * 0.005
      scene.rotation.x += deltaY * 0.005

      previousMousePosition = { x: e.clientX, y: e.clientY }
    })

    domElement.addEventListener('mouseup', () => {
      isDragging = false
    })

    domElement.addEventListener('mouseleave', () => {
      isDragging = false
    })

    // Wheel zoom
    domElement.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY
      const zoomSpeed = 0.1

      camera.position.z += delta * zoomSpeed
      camera.position.z = Math.max(
        CONFIG.minDistance,
        Math.min(CONFIG.maxDistance, camera.position.z)
      )
    })
  }

  const setupClickDetection = (
    THREE: any,
    domElement: HTMLElement,
    camera: any,
    scene: any
  ) => {
    domElement.addEventListener('click', (e: MouseEvent) => {
      if (!raycasterRef.current || !starsRef.current.length) return

      const raycaster = raycasterRef.current
      const mouse = mouseRef.current

      // Update raycaster with mouse position
      raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera)

      // Raycast against all star mesh objects
      const intersects = raycaster.intersectObjects(starsRef.current)

      if (intersects.length > 0) {
        // Get the first intersected star
        const intersect = intersects[0]
        const starMesh = intersect.object as THREE.Mesh

        // Check if the mesh has star metadata in userData
        if (starMesh.userData && starMesh.userData.id) {
          // Create a StarData object from userData
          const selectedStarData: StarData = {
            id: starMesh.userData.id,
            issueNumber: starMesh.userData.issueNumber,
            title: starMesh.userData.title,
            description: starMesh.userData.description,
            position: { x: starMesh.position.x, y: starMesh.position.y, z: starMesh.position.z },
            color: starMesh.userData.color,
            size: starMesh.userData.size,
            brightness: starMesh.userData.brightness,
            priority: starMesh.userData.priority,
            linesChanged: starMesh.userData.linesChanged,
            files: starMesh.userData.files,
            commitHash: starMesh.userData.commitHash,
            mergedAt: starMesh.userData.mergedAt,
            builtBy: starMesh.userData.builtBy,
            pulse: false, // Not stored in userData but defaults to false
          }
          setSelectedStar(selectedStarData)
        }
      } else {
        // Click on empty space - clear selection
        setSelectedStar(null)
      }
    })
  }

  const animate = (THREE: any, scene: any, camera: any, renderer: any) => {
    const animationLoop = () => {
      // Auto-rotate
      if (sceneRef.current) {
        sceneRef.current.rotation.y += CONFIG.rotationSpeed
      }

      renderer.render(scene, camera)
      animationRef.current = requestAnimationFrame(animationLoop)
    }

    animationRef.current = requestAnimationFrame(animationLoop)
  }

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
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const refreshGalaxy = () => {
    // Reload star data
    const fetchData = async () => {
      try {
        const [starsRes, statsRes] = await Promise.all([
          fetch('/api/galaxy/stars'),
          fetch('/api/galaxy/stats'),
        ])

        const starsData = await starsRes.json()
        const statsData = await statsRes.json()

        setStarData(starsData.stars || [])
        setStats(statsData)
      } catch (error) {
        console.error('Failed to refresh galaxy data:', error)
      }
    }

    fetchData()
  }

  return (
    <div className="relative h-full">
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

      {/* Stats Display */}
      <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-blue-300/70">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.today}</div>
            <div className="text-blue-300/70">Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.week}</div>
            <div className="text-blue-300/70">Week</div>
          </div>
        </div>
      </div>

      {/* Galaxy Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Selected Star Modal */}
      {selectedStar && (
        <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 max-w-lg w-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  #{selectedStar.issueNumber} {selectedStar.title}
                </h3>
                <p className="text-blue-200/70">{selectedStar.description}</p>
              </div>
              <button
                onClick={() => setSelectedStar(null)}
                className="text-white/70 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-blue-300/70 mb-1">Built By</div>
                <div className="text-white font-semibold">{selectedStar.builtBy}</div>
              </div>
              <div>
                <div className="text-blue-300/70 mb-1">Files Changed</div>
                <div className="text-white font-semibold">{selectedStar.files}</div>
              </div>
              <div>
                <div className="text-blue-300/70 mb-1">Lines Changed</div>
                <div className="text-white font-semibold">{selectedStar.linesChanged}</div>
              </div>
              <div>
                <div className="text-blue-300/70 mb-1">Priority</div>
                <div className="text-white font-semibold capitalize">{selectedStar.priority}</div>
              </div>
            </div>
            {selectedStar.mergedAt && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-blue-300/70 mb-1">Merged At</div>
                <div className="text-white">
                  {new Date(selectedStar.mergedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
        <div className="text-xs font-semibold text-white mb-2">Feature Types</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-white/70">UI Features</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-white/70">Logic & APIs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-white/70">Data & Models</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-white/70">Infrastructure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
            <span className="text-white/70">Tests</span>
          </div>
        </div>
        <div className="text-xs font-semibold text-white mt-3 mb-2">Controls</div>
        <div className="text-xs text-white/70">
          Drag to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  )
}
