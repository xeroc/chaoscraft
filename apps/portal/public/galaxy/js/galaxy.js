// Galaxy.js - Three.js visualization of the ChaosCraft galaxy

let scene, camera, renderer, controls
let stars = []
let raycaster, mouse
let selectedStar = null
let autoRotate = true

// Configuration
const CONFIG = {
  starCount: 0, // Will be set from STAR_DATA
  cameraDistance: 150,
  minDistance: 20,
  maxDistance: 300,
  rotationSpeed: 0.0005,
}

// Initialize
function init() {
  // Scene
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x000000, 0.002)

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 0, CONFIG.cameraDistance)

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  document.getElementById('galaxy-container').appendChild(renderer.domElement)

  // Raycaster for mouse interaction
  raycaster = new THREE.Raycaster()
  raycaster.params.Points.threshold = 5
  mouse = new THREE.Vector2()

  // Add stars
  createStars()

  // Add background particles (cosmic dust)
  createBackgroundParticles()

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
  scene.add(ambientLight)

  // Add point light
  const pointLight = new THREE.PointLight(0xffffff, 1, 500)
  pointLight.position.set(0, 0, 0)
  scene.add(pointLight)

  // Controls (simple orbit)
  setupControls()

  // Event listeners
  window.addEventListener('resize', onWindowResize)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('click', onMouseClick)

  // Update stats
  updateStats()

  // Start animation
  animate()
}

// Create stars from STAR_DATA
function createStars() {
  if (!window.STAR_DATA || window.STAR_DATA.length === 0) {
    console.warn('No star data available')
    return
  }

  const starGeometry = new THREE.BufferGeometry()
  const positions = []
  const colors = []
  const sizes = []

  window.STAR_DATA.forEach((starData) => {
    const { x, y, z } = starData.position
    positions.push(x, y, z)

    // Color
    const color = new THREE.Color(window.COLOR_MAPPINGS[starData.color] || '#ffffff')
    colors.push(color.r, color.g, color.b)

    // Size (scale for visibility)
    sizes.push(starData.size)
  })

  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))

  const starMaterial = new THREE.PointsMaterial({
    size: 3,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
  })

  const starPoints = new THREE.Points(starGeometry, starMaterial)
  scene.add(starPoints)
  stars.push(starPoints)

  // Store star data for interaction
  window.STAR_DATA.forEach((starData, index) => {
    starData.index = index
  })

  CONFIG.starCount = window.STAR_DATA.length
}

// Create background particles
function createBackgroundParticles() {
  const particleCount = 2000
  const geometry = new THREE.BufferGeometry()
  const positions = []

  for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 500
    const y = (Math.random() - 0.5) * 500
    const z = (Math.random() - 0.5) * 500
    positions.push(x, y, z)
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const material = new THREE.PointsMaterial({
    size: 0.5,
    color: 0x888888,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
  })

  const particles = new THREE.Points(geometry, material)
  scene.add(particles)
}

// Setup mouse controls for rotation
function setupControls() {
  let isDragging = false
  let previousMousePosition = { x: 0, y: 0 }

  const galaxyContainer = renderer.domElement

  galaxyContainer.addEventListener('mousedown', (e) => {
    isDragging = true
    previousMousePosition = { x: e.clientX, y: e.clientY }
  })

  galaxyContainer.addEventListener('mousemove', (e) => {
    if (!isDragging) return

    const deltaX = e.clientX - previousMousePosition.x
    const deltaY = e.clientY - previousMousePosition.y

    // Rotate scene based on mouse movement
    scene.rotation.y += deltaX * 0.005
    scene.rotation.x += deltaY * 0.005

    previousMousePosition = { x: e.clientX, y: e.clientY }
  })

  galaxyContainer.addEventListener('mouseup', () => {
    isDragging = false
  })

  galaxyContainer.addEventListener('mouseleave', () => {
    isDragging = false
  })

  // Wheel zoom
  galaxyContainer.addEventListener('wheel', (e) => {
    e.preventDefault()
    const delta = e.deltaY
    const zoomSpeed = 0.1

    camera.position.z += delta * zoomSpeed
    camera.position.z = Math.max(CONFIG.minDistance, Math.min(CONFIG.maxDistance, camera.position.z))
  })

  // Button controls
  document.getElementById('zoom-in')?.addEventListener('click', () => {
    camera.position.z = Math.max(CONFIG.minDistance, camera.position.z - 20)
  })

  document.getElementById('zoom-out')?.addEventListener('click', () => {
    camera.position.z = Math.min(CONFIG.maxDistance, camera.position.z + 20)
  })

  document.getElementById('reset-view')?.addEventListener('click', () => {
    camera.position.set(0, 0, CONFIG.cameraDistance)
    scene.rotation.set(0, 0, 0)
  })

  document.getElementById('toggle-auto-rotate')?.addEventListener('click', (e) => {
    autoRotate = !autoRotate
    e.target.textContent = autoRotate ? '⏸' : '▶'
  })
}

// Window resize handler
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// Mouse move handler (for raycasting)
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  // Raycast for hover effect
  raycaster.setFromCamera(mouse, camera)

  if (stars.length > 0) {
    const intersects = raycaster.intersectObject(stars[0])

    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer'
    } else {
      document.body.style.cursor = 'default'
    }
  }
}

// Mouse click handler (for selection)
function onMouseClick(event) {
  raycaster.setFromCamera(mouse, camera)

  if (stars.length > 0) {
    const intersects = raycaster.intersectObject(stars[0])

    if (intersects.length > 0) {
      const index = intersects[0].index
      const starData = window.STAR_DATA[index]

      if (starData) {
        showStarModal(starData)
      }
    }
  }
}

// Show star details modal
function showStarModal(starData) {
  const modal = document.getElementById('star-modal')
  const modalBody = document.getElementById('star-modal-body')

  if (!modal || !modalBody) return

  const color = window.COLOR_MAPPINGS[starData.color] || '#ffffff'

  modalBody.innerHTML = `
    <div class="feature-card">
      <div class="feature-header">
        <div class="feature-icon" style="background: ${color}">
          🌟
        </div>
        <div class="feature-info">
          <h2>${starData.title}</h2>
          <div class="feature-number">Feature #${starData.issueNumber}</div>
        </div>
      </div>

      <div class="feature-body">
        <p>${starData.description}</p>
      </div>

      <div class="feature-stats">
        <div class="stat-item">
          <div class="stat-value">${starData.linesChanged}</div>
          <div class="stat-label">Lines Changed</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${starData.files}</div>
          <div class="stat-label">Files</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${starData.priority}</div>
          <div class="stat-label">Priority</div>
        </div>
      </div>

      <div class="feature-actions">
        <a href="https://github.com/repofun/repofun/issues/${starData.issueNumber}" target="_blank" class="action-btn">
          View Issue
        </a>
        <a href="https://github.com/repofun/repofun/commit/${starData.commitHash}" target="_blank" class="action-btn primary">
          View Commit
        </a>
      </div>

      <div class="feature-meta">
        <div class="feature-meta-item">
          <span class="feature-meta-icon">👤</span>
          <span>Built by @${starData.builtBy}</span>
        </div>
        <div class="feature-meta-item">
          <span class="feature-meta-icon">📅</span>
          <span>${new Date(starData.mergedAt).toLocaleDateString()}</span>
        </div>
        <div class="feature-meta-item">
          <span class="feature-meta-icon">🎨</span>
          <span style="color: ${color}">${starData.color}</span>
        </div>
      </div>
    </div>
  `

  modal.classList.remove('hidden')

  // Close button
  const closeBtn = modal.querySelector('.close-modal')
  closeBtn?.addEventListener('click', () => {
    modal.classList.add('hidden')
  })

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden')
    }
  })

  // Close on Escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      modal.classList.add('hidden')
      document.removeEventListener('keydown', escapeHandler)
    }
  }
  document.addEventListener('keydown', escapeHandler)
}

// Update statistics in header
function updateStats() {
  const totalStars = window.STAR_DATA?.length || 0

  document.getElementById('star-count').textContent = totalStars
  document.getElementById('stars-total').textContent = totalStars

  // Calculate today's stars
  const today = new Date().toDateString()
  const todayStars = window.STAR_DATA?.filter(
    (star) => new Date(star.mergedAt).toDateString() === today
  ).length || 0
  document.getElementById('stars-today').textContent = todayStars

  // Calculate this week's stars
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const weekStars = window.STAR_DATA?.filter(
    (star) => new Date(star.mergedAt) > oneWeekAgo
  ).length || 0
  document.getElementById('stars-week').textContent = weekStars
}

// Animation loop
function animate() {
  requestAnimationFrame(animate)

  // Auto-rotate
  if (autoRotate) {
    scene.rotation.y += CONFIG.rotationSpeed
  }

  // Pulse effect for express stars
  const pulseStars = window.STAR_DATA?.filter((star) => star.pulse) || []
  if (pulseStars.length > 0 && stars[0]) {
    const geometry = stars[0].geometry
    const sizes = geometry.attributes.size.array

    pulseStars.forEach((starData) => {
      if (starData.index !== undefined) {
        const pulse = Math.sin(Date.now() * 0.003) * 2 + starData.size
        sizes[starData.index] = pulse
      }
    })

    geometry.attributes.size.needsUpdate = true
  }

  renderer.render(scene, camera)
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
