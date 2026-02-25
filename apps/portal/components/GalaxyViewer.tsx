'use client'

import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import StarDetailModal from './StarDetailModal'

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

  // Selection visual refs
  const selectedMeshRef = useRef<any>(null)
  const selectionRingRef = useRef<any>(null)
  const targetScaleRef = useRef<number>(1)

  const CONFIG = {
    cameraDistance: 150,
    minDistance: 20,
    maxDistance: 300,
    rotationSpeed: 0.0005,
    selectionScaleMultiplier: 2.5,
    selectionAnimationSpeed: 0.08,
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
      // Dispose of selection ring
      if (selectionRingRef.current) {
        if (selectionRingRef.current.geometry) {
          selectionRingRef.current.geometry.dispose()
        }
        if (selectionRingRef.current.material) {
          selectionRingRef.current.material.dispose()
        }
        selectionRingRef.current = null
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
      selectedMeshRef.current = null
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
        prUrl: starDataItem.prUrl,
        filesChanged: starDataItem.filesChanged,
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

    // Helper function to check for hover and update cursor
    const checkHover = (mouseX: number, mouseY: number) => {
      if (!raycasterRef.current || !starsRef.current.length) {
        domElement.style.cursor = 'default'
        return
      }

      const raycaster = raycasterRef.current

      // Update raycaster with mouse position
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera)

      // Raycast against all star mesh objects
      const intersects = raycaster.intersectObjects(starsRef.current)

      // Change cursor to pointer if hovering over a star, default otherwise
      domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default'
    }

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

      // Check hover and update cursor
      checkHover(x, y)

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
      // Reset cursor when leaving the canvas
      domElement.style.cursor = 'default'
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
    // Helper to reset previous selection visual
    const resetSelectionVisual = () => {
      // Remove old selection ring
      if (selectionRingRef.current) {
        scene.remove(selectionRingRef.current)
        if (selectionRingRef.current.geometry) {
          selectionRingRef.current.geometry.dispose()
        }
        if (selectionRingRef.current.material) {
          selectionRingRef.current.material.dispose()
        }
        selectionRingRef.current = null
      }

      // Reset scale of previously selected mesh
      if (selectedMeshRef.current) {
        selectedMeshRef.current.scale.set(1, 1, 1)
        selectedMeshRef.current = null
      }
      targetScaleRef.current = 1
    }

    // Helper to apply selection visual to a mesh
    const applySelectionVisual = (starMesh: any) => {
      // Reset any previous selection
      resetSelectionVisual()

      // Set new selection
      selectedMeshRef.current = starMesh
      targetScaleRef.current = CONFIG.selectionScaleMultiplier

      // Create selection ring (torus around the star)
      const ringRadius = (starMesh.geometry?.radius || starMesh.userData.size * 0.5) * 2.5
      const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.2, 8, 32)
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      })
      const selectionRing = new THREE.Mesh(ringGeometry, ringMaterial)

      // Position ring at star position
      selectionRing.position.set(
        starMesh.position.x,
        starMesh.position.y,
        starMesh.position.z
      )

      scene.add(selectionRing)
      selectionRingRef.current = selectionRing
    }

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
          // Apply selection visual
          applySelectionVisual(starMesh)

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
            prUrl: starMesh.userData.prUrl,
            filesChanged: starMesh.userData.filesChanged || [],
            pulse: false, // Not stored in userData but defaults to false
          }
          setSelectedStar(selectedStarData)
        }
      } else {
        // Click on empty space - clear selection
        resetSelectionVisual()
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

      // Animate selection scale with smooth transition
      if (selectedMeshRef.current) {
        const mesh = selectedMeshRef.current
        const currentScale = mesh.scale.x
        const targetScale = targetScaleRef.current

        // Smooth interpolation (lerp)
        const newScale = currentScale + (targetScale - currentScale) * CONFIG.selectionAnimationSpeed

        if (Math.abs(newScale - currentScale) > 0.001) {
          mesh.scale.set(newScale, newScale, newScale)
        }

        // Animate selection ring rotation for visual effect
        if (selectionRingRef.current) {
          selectionRingRef.current.rotation.z += 0.01
          selectionRingRef.current.rotation.x += 0.005
        }
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

  // Clear selection visual and state
  const clearSelection = () => {
    // Remove selection ring
    if (selectionRingRef.current && sceneRef.current) {
      sceneRef.current.remove(selectionRingRef.current)
      if (selectionRingRef.current.geometry) {
        selectionRingRef.current.geometry.dispose()
      }
      if (selectionRingRef.current.material) {
        selectionRingRef.current.material.dispose()
      }
      selectionRingRef.current = null
    }

    // Reset scale of previously selected mesh
    if (selectedMeshRef.current) {
      selectedMeshRef.current.scale.set(1, 1, 1)
      selectedMeshRef.current = null
    }
    targetScaleRef.current = 1

    setSelectedStar(null)
  }

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
        <StarDetailModal star={selectedStar} onClose={clearSelection} />
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
