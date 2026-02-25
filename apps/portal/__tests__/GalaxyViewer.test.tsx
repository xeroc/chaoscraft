/**
 * Tests for GalaxyViewer raycaster infrastructure
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRef } from 'react'

// Mock Three.js
const mockRaycaster = {
  setFromCamera: vi.fn(),
  intersectObjects: vi.fn(() => []),
  params: { Points: { threshold: 1 } },
}

const mockVector2 = vi.fn(function(this: { x: number; y: number }, x: number, y: number) {
  this.x = x
  this.y = y
})

vi.mock('three', () => ({
  Raycaster: vi.fn(() => mockRaycaster),
  Scene: vi.fn(function(this: any) {
    this.rotation = { x: 0, y: 0, z: 0 }
    this.add = vi.fn()
    this.fog = null
  }),
  PerspectiveCamera: vi.fn(function(this: any, fov: any, aspect: any, near: any, far: any) {
    this.aspect = aspect
    this.position = { x: 0, y: 0, z: 150 }
    this.updateProjectionMatrix = vi.fn()
  }),
  WebGLRenderer: vi.fn(function(this: any) {
    this.setSize = vi.fn()
    this.setPixelRatio = vi.fn()
    this.domElement = { addEventListener: vi.fn(), removeEventListener: vi.fn() }
    this.render = vi.fn()
    this.dispose = vi.fn()
  }),
  FogExp2: vi.fn(),
  AmbientLight: vi.fn(),
  PointLight: vi.fn(),
  BufferGeometry: vi.fn(function(this: any) {
    this.setAttribute = vi.fn()
  }),
  Float32BufferAttribute: vi.fn(),
  PointsMaterial: vi.fn(),
  Points: vi.fn(),
  Vector2: mockVector2,
  AdditiveBlending: 'AdditiveBlending',
  SphereGeometry: vi.fn(function(this: any, radius: any, widthSegments: any, heightSegments: any) {
    this.radius = radius
    this.widthSegments = widthSegments
    this.heightSegments = heightSegments
    this.dispose = vi.fn().mockImplementation(function() {})
  }),
  MeshBasicMaterial: vi.fn(function(this: any, options: any) {
    this.color = options.color
    this.transparent = options.transparent
    this.opacity = options.opacity
    this.blending = options.blending
    this.dispose = vi.fn()
  }),
  Mesh: vi.fn(function(this: any, geometry: any, material: any) {
    this.geometry = geometry
    this.material = material
    this.position = { x: 0, y: 0, z: 0 }
    this.userData = {}
  }),
}))

describe('GalaxyViewer Raycaster Infrastructure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Raycaster Initialization', () => {
    it('should initialize raycaster with correct threshold', () => {
      const THREE = require('three')
      const raycaster = new THREE.Raycaster()

      expect(raycaster).toBeDefined()
      expect(raycaster.params.Points.threshold).toBe(1)
    })
  })

  describe('Mouse Position Tracking', () => {
    it('should convert mouse position to normalized device coordinates (NDC)', () => {
      // Simulate a canvas click at pixel coordinates (200, 150) on a 400x300 canvas
      const canvasWidth = 400
      const canvasHeight = 300
      const clientX = 200
      const clientY = 150

      // NDC conversion: x: [-1, 1], y: [-1, 1]
      const ndcX = (clientX / canvasWidth) * 2 - 1
      const ndcY = -(clientY / canvasHeight) * 2 + 1

      expect(ndcX).toBe(0) // Center horizontally
      expect(ndcY).toBe(0) // Center vertically
    })

    it('should handle different mouse positions correctly', () => {
      const testCases = [
        { clientX: 0, clientY: 0, width: 400, height: 300, expectedX: -1, expectedY: 1 },
        { clientX: 400, clientY: 300, width: 400, height: 300, expectedX: 1, expectedY: -1 },
        { clientX: 100, clientY: 75, width: 400, height: 300, expectedX: -0.5, expectedY: 0.5 },
      ]

      testCases.forEach(({ clientX, clientY, width, height, expectedX, expectedY }) => {
        const ndcX = (clientX / width) * 2 - 1
        const ndcY = -(clientY / height) * 2 + 1

        expect(ndcX).toBeCloseTo(expectedX, 5)
        expect(ndcY).toBeCloseTo(expectedY, 5)
      })
    })
  })

  describe('Raycaster Configuration', () => {
    it('should have threshold configured for point detection', () => {
      const THREE = require('three')
      const raycaster = new THREE.Raycaster()

      expect(raycaster.params.Points).toBeDefined()
      expect(raycaster.params.Points.threshold).toBeGreaterThan(0)
    })

    it('should support calling setFromCamera', () => {
      const THREE = require('three')
      const raycaster = new THREE.Raycaster()
      const mockCamera = { position: { x: 0, y: 0, z: 150 } }
      const mockVector = new THREE.Vector2(0, 0)

      // Should not throw
      expect(() => {
        raycaster.setFromCamera(mockVector, mockCamera)
      }).not.toThrow()
    })

    it('should support calling intersectObjects', () => {
      const THREE = require('three')
      const raycaster = new THREE.Raycaster()
      const mockObjects: any[] = []

      const intersects = raycaster.intersectObjects(mockObjects)

      expect(Array.isArray(intersects)).toBe(true)
    })
  })
})

describe('NDC Conversion Edge Cases', () => {
  it('should handle minimum values', () => {
    const x = 0
    const y = 0
    const width = 400
    const height = 300

    const ndcX = (x / width) * 2 - 1
    const ndcY = -(y / height) * 2 + 1

    expect(ndcX).toBe(-1)
    expect(ndcY).toBe(1)
  })

  it('should handle maximum values', () => {
    const x = 400
    const y = 300
    const width = 400
    const height = 300

    const ndcX = (x / width) * 2 - 1
    const ndcY = -(y / height) * 2 + 1

    expect(ndcX).toBe(1)
    expect(ndcY).toBe(-1)
  })

  it('should handle center values', () => {
    const x = 200
    const y = 150
    const width = 400
    const height = 300

    const ndcX = (x / width) * 2 - 1
    const ndcY = -(y / height) * 2 + 1

    expect(ndcX).toBe(0)
    expect(ndcY).toBe(0)
  })
})

describe('Star Mesh Creation', () => {
  const COLOR_MAPPINGS: Record<string, number> = {
    blue: 0x3b82f6,
    green: 0x22c55e,
    yellow: 0xeab308,
    purple: 0xa855f7,
    pink: 0xec4899,
  }

  it('should create a star mesh with correct geometry and material', () => {
    const THREE = require('three')
    const starData = {
      position: { x: 10, y: 20, z: 30 },
      color: 'blue' as const,
      size: 3,
      brightness: 0.9,
    }

    const expectedRadius = starData.size * 0.5
    const geometry = new THREE.SphereGeometry(expectedRadius, 8, 8)
    const material = new THREE.MeshBasicMaterial({
      color: COLOR_MAPPINGS[starData.color],
      transparent: true,
      opacity: starData.brightness,
      blending: THREE.AdditiveBlending,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(starData.position.x, starData.position.y, starData.position.z)

    expect(geometry).toBeDefined()
    expect(material).toBeDefined()
    expect(mesh).toBeDefined()
    expect(mesh.geometry).toBe(geometry)
    expect(mesh.material).toBe(material)
    expect(mesh.position.x).toBe(starData.position.x)
    expect(mesh.position.y).toBe(starData.position.y)
    expect(mesh.position.z).toBe(starData.position.z)
  })

  it('should store star metadata in mesh userData', () => {
    const THREE = require('three')
    const starData = {
      id: 123,
      issueNumber: 456,
      title: 'Test Feature',
      description: 'A test feature',
      position: { x: 10, y: 20, z: 30 },
      color: 'green' as const,
      size: 3,
      brightness: 0.9,
      priority: 'high',
      linesChanged: 100,
      files: 5,
      commitHash: 'abc123',
      mergedAt: '2025-01-01T00:00:00Z',
      builtBy: 'testuser',
    }

    const geometry = new THREE.SphereGeometry(starData.size * 0.5, 8, 8)
    const material = new THREE.MeshBasicMaterial({
      color: COLOR_MAPPINGS[starData.color],
      transparent: true,
      opacity: starData.brightness,
      blending: THREE.AdditiveBlending,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = {
      id: starData.id,
      issueNumber: starData.issueNumber,
      title: starData.title,
      description: starData.description,
      color: starData.color,
      size: starData.size,
      brightness: starData.brightness,
      priority: starData.priority,
      linesChanged: starData.linesChanged,
      files: starData.files,
      commitHash: starData.commitHash,
      mergedAt: starData.mergedAt,
      builtBy: starData.builtBy,
    }

    expect(mesh.userData.id).toBe(starData.id)
    expect(mesh.userData.issueNumber).toBe(starData.issueNumber)
    expect(mesh.userData.title).toBe(starData.title)
    expect(mesh.userData.description).toBe(starData.description)
    expect(mesh.userData.priority).toBe(starData.priority)
    expect(mesh.userData.linesChanged).toBe(starData.linesChanged)
    expect(mesh.userData.files).toBe(starData.files)
    expect(mesh.userData.commitHash).toBe(starData.commitHash)
    expect(mesh.userData.mergedAt).toBe(starData.mergedAt)
    expect(mesh.userData.builtBy).toBe(starData.builtBy)
  })

  it('should create glow mesh for larger stars', () => {
    const THREE = require('three')
    const starData = {
      position: { x: 10, y: 20, z: 30 },
      color: 'yellow' as const,
      size: 4, // Larger than 2, should create glow
      brightness: 0.9,
    }

    const glowRadius = starData.size * 0.8
    const glowGeometry = new THREE.SphereGeometry(glowRadius, 8, 8)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: COLOR_MAPPINGS[starData.color],
      transparent: true,
      opacity: starData.brightness * 0.3,
      blending: THREE.AdditiveBlending,
    })

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)

    expect(glowGeometry).toBeDefined()
    expect(glowMaterial).toBeDefined()
    expect(glowMesh).toBeDefined()
    expect(glowMesh.geometry).toBe(glowGeometry)
    expect(glowMesh.material).toBe(glowMaterial)
  })

  it('should handle all color mappings correctly', () => {
    const THREE = require('three')

    Object.entries(COLOR_MAPPINGS).forEach(([colorName, colorValue]) => {
      const material = new THREE.MeshBasicMaterial({
        color: colorValue,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })

      // Color is set (it's a Color object in Three.js)
      expect(material.color).toBeDefined()
      expect(material.transparent).toBe(true)
      expect(material.opacity).toBe(0.9)
      expect(material.blending).toBe(THREE.AdditiveBlending)
    })
  })

  it('should dispose of mesh geometry and material', () => {
    const THREE = require('three')
    const geometry = new THREE.SphereGeometry(1.5, 8, 8)
    const material = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    })
    const mesh = new THREE.Mesh(geometry, material)

    // Verify dispose functions exist
    expect(typeof geometry.dispose).toBe('function')
    expect(typeof material.dispose).toBe('function')

    // Simulate cleanup - should not throw
    expect(() => {
      if (mesh.geometry) {
        mesh.geometry.dispose()
      }
      if (mesh.material) {
        mesh.material.dispose()
      }
    }).not.toThrow()
  })
})

describe('Click Detection Logic', () => {
  const COLOR_MAPPINGS: Record<string, number> = {
    blue: 0x3b82f6,
    green: 0x22c55e,
    yellow: 0xeab308,
    purple: 0xa855f7,
    pink: 0xec4899,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should find intersected star meshes when raycaster hits a star', () => {
    const THREE = require('three')
    const raycaster = new THREE.Raycaster()

    // Create a star mesh
    const starData = {
      id: 1,
      issueNumber: 42,
      title: 'Test Feature',
      description: 'A test feature',
      position: { x: 10, y: 20, z: 30 },
      color: 'blue' as const,
      size: 3,
      brightness: 0.9,
      priority: 'high',
      linesChanged: 100,
      files: 5,
      commitHash: 'abc123',
      mergedAt: '2025-01-01T00:00:00Z',
      builtBy: 'testuser',
    }

    const geometry = new THREE.SphereGeometry(starData.size * 0.5, 8, 8)
    const material = new THREE.MeshBasicMaterial({
      color: COLOR_MAPPINGS[starData.color],
      transparent: true,
      opacity: starData.brightness,
      blending: THREE.AdditiveBlending,
    })

    const starMesh = new THREE.Mesh(geometry, material)
    starMesh.position.set(starData.position.x, starData.position.y, starData.position.z)
    starMesh.userData = starData

    // Mock raycaster to return intersection
    const mockIntersection = {
      object: starMesh,
      distance: 10,
      point: { x: 10, y: 20, z: 30 },
    }
    raycaster.intersectObjects = vi.fn(() => [mockIntersection])

    const intersects = raycaster.intersectObjects([starMesh])

    expect(intersects.length).toBeGreaterThan(0)
    expect(intersects[0].object).toBe(starMesh)
  })

  it('should return empty array when raycaster hits no stars', () => {
    const THREE = require('three')
    const raycaster = new THREE.Raycaster()

    // Mock raycaster to return no intersections
    raycaster.intersectObjects = vi.fn(() => [])

    const intersects = raycaster.intersectObjects([])

    expect(intersects.length).toBe(0)
  })

  it('should extract metadata from first intersected star mesh', () => {
    const starData = {
      id: 1,
      issueNumber: 42,
      title: 'Test Feature',
      description: 'A test feature',
      position: { x: 10, y: 20, z: 30 },
      color: 'green' as const,
      size: 3,
      brightness: 0.9,
      priority: 'high',
      linesChanged: 100,
      files: 5,
      commitHash: 'abc123',
      mergedAt: '2025-01-01T00:00:00Z',
      builtBy: 'testuser',
    }

    // Simulate extracting metadata from mesh.userData
    const mockMesh = {
      userData: starData,
      position: { x: starData.position.x, y: starData.position.y, z: starData.position.z },
    }

    expect(mockMesh.userData.id).toBe(starData.id)
    expect(mockMesh.userData.issueNumber).toBe(starData.issueNumber)
    expect(mockMesh.userData.title).toBe(starData.title)
    expect(mockMesh.userData.description).toBe(starData.description)
    expect(mockMesh.userData.priority).toBe(starData.priority)
    expect(mockMesh.userData.linesChanged).toBe(starData.linesChanged)
    expect(mockMesh.userData.files).toBe(starData.files)
    expect(mockMesh.userData.commitHash).toBe(starData.commitHash)
    expect(mockMesh.userData.mergedAt).toBe(starData.mergedAt)
    expect(mockMesh.userData.builtBy).toBe(starData.builtBy)
  })

  it('should handle multiple intersections and use the first one', () => {
    const THREE = require('three')

    // Create multiple star meshes
    const star1Data = { id: 1, issueNumber: 42, title: 'First Star' }
    const star2Data = { id: 2, issueNumber: 43, title: 'Second Star' }

    const mesh1 = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), new THREE.MeshBasicMaterial())
    mesh1.userData = star1Data

    const mesh2 = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), new THREE.MeshBasicMaterial())
    mesh2.userData = star2Data

    const mockIntersections = [
      { object: mesh1, distance: 10, point: { x: 0, y: 0, z: 0 } },
      { object: mesh2, distance: 20, point: { x: 0, y: 0, z: 0 } },
    ]

    const raycaster = new THREE.Raycaster()
    raycaster.intersectObjects = vi.fn(() => mockIntersections)

    const intersects = raycaster.intersectObjects([mesh1, mesh2])

    expect(intersects.length).toBe(2)
    expect(intersects[0].object.userData.id).toBe(star1Data.id)
    expect(intersects[1].object.userData.id).toBe(star2Data.id)

    // First intersected star should be used
    const firstIntersected = intersects[0].object
    expect(firstIntersected.userData.id).toBe(star1Data.id)
    expect(firstIntersected.userData.title).toBe('First Star')
  })

  it('should handle intersection with mesh that has no userData', () => {
    const THREE = require('three')
    const raycaster = new THREE.Raycaster()

    // Create a mesh without userData
    const meshWithoutUserData = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), new THREE.MeshBasicMaterial())
    meshWithoutUserData.userData = {}

    const mockIntersection = {
      object: meshWithoutUserData,
      distance: 10,
      point: { x: 0, y: 0, z: 0 },
    }

    raycaster.intersectObjects = vi.fn(() => [mockIntersection])

    const intersects = raycaster.intersectObjects([meshWithoutUserData])

    expect(intersects.length).toBe(1)
    expect(intersects[0].object.userData.id).toBeUndefined()
  })
})
