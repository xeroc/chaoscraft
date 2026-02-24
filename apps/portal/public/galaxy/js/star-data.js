// star-data.js - Fetches data from Next.js API
// This file now loads data dynamically from the Next.js backend

window.STAR_DATA = []
window.COLOR_MAPPINGS = {
  blue: "#3b82f6",    // UI Features
  green: "#22c55e",   // Logic & APIs
  yellow: "#eab308",  // Data & Models
  purple: "#a855f7",  // Infrastructure
  pink: "#ec4899",    // Tests
}

// Fetch star data from API
async function fetchStarData() {
  try {
    const response = await fetch('/api/galaxy/stars')
    if (!response.ok) throw new Error('Failed to fetch star data')

    const data = await response.json()
    window.STAR_DATA = data.stars || []
    window.COLOR_MAPPINGS = data.colorMappings || window.COLOR_MAPPINGS

    // Dispatch event to notify galaxy that data is loaded
    window.dispatchEvent(new CustomEvent('starDataLoaded'))

    return window.STAR_DATA
  } catch (error) {
    console.error('Error fetching star data:', error)
    return window.STAR_DATA
  }
}

// Fetch stats from API
async function fetchStats() {
  try {
    const response = await fetch('/api/galaxy/stats')
    if (!response.ok) throw new Error('Failed to fetch stats')

    const stats = await response.json()
    return stats
  } catch (error) {
    console.error('Error fetching stats:', error)
    return { total: 0, today: 0, week: 0 }
  }
}

// Initialize data on page load
document.addEventListener('DOMContentLoaded', async () => {
  await fetchStarData()

  // Update stats
  const stats = await fetchStats()
  const starsTotal = document.getElementById('stars-total')
  const starsToday = document.getElementById('stars-today')
  const starsWeek = document.getElementById('stars-week')

  if (starsTotal) starsTotal.textContent = stats.total
  if (starsToday) starsToday.textContent = stats.today
  if (starsWeek) starsWeek.textContent = stats.week
})

// Expose fetch functions for manual refresh
window.refreshStarData = fetchStarData
