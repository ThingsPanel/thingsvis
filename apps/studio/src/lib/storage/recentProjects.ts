/**
 * Recent Projects Manager
 * 
 * Manages the list of recently accessed projects stored in localStorage.
 * Provides quick access to project metadata without loading full project data.
 */

import type { RecentProjectEntry } from './schemas'
import { STORAGE_CONSTANTS } from './constants'

// =============================================================================
// Recent Projects Implementation
// =============================================================================

/**
 * Get recent projects list from localStorage.
 * Returns up to MAX_RECENT_PROJECTS most recently modified projects.
 */
function getRecentProjects(): RecentProjectEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_CONSTANTS.RECENT_PROJECTS_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored) as RecentProjectEntry[]
    
    // Validate and return
    if (!Array.isArray(parsed)) return []
    
    return parsed
      .filter(entry => entry && typeof entry.id === 'string')
      .slice(0, STORAGE_CONSTANTS.MAX_RECENT_PROJECTS)
  } catch {
    return []
  }
}

/**
 * Save recent projects list to localStorage.
 */
function saveRecentProjects(projects: RecentProjectEntry[]): void {
  try {
    // Sort by updatedAt descending and limit to max
    const sorted = [...projects]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, STORAGE_CONSTANTS.MAX_RECENT_PROJECTS)

    localStorage.setItem(
      STORAGE_CONSTANTS.RECENT_PROJECTS_KEY,
      JSON.stringify(sorted)
    )
  } catch (error) {
    
  }
}

/**
 * Add or update a project in the recent projects list.
 */
function addToRecent(entry: RecentProjectEntry): void {
  const current = getRecentProjects()
  
  // Remove existing entry with same ID
  const filtered = current.filter(p => p.id !== entry.id)
  
  // Add new entry at the beginning
  const updated = [entry, ...filtered]
  
  saveRecentProjects(updated)
}

/**
 * Remove a project from the recent projects list.
 * Does not delete the project from IndexedDB.
 */
function removeFromRecent(projectId: string): void {
  const current = getRecentProjects()
  const filtered = current.filter(p => p.id !== projectId)
  saveRecentProjects(filtered)
}

/**
 * Update project name in recent projects list.
 */
function updateProjectName(projectId: string, name: string): void {
  const current = getRecentProjects()
  const updated = current.map(p =>
    p.id === projectId ? { ...p, name } : p
  )
  saveRecentProjects(updated)
}

/**
 * Update project thumbnail in recent projects list.
 */
function updateProjectThumbnail(projectId: string, thumbnail: string): void {
  const current = getRecentProjects()
  const updated = current.map(p =>
    p.id === projectId ? { ...p, thumbnail } : p
  )
  saveRecentProjects(updated)
}

/**
 * Clear all recent projects.
 */
function clearRecentProjects(): void {
  localStorage.removeItem(STORAGE_CONSTANTS.RECENT_PROJECTS_KEY)
}

// =============================================================================
// Singleton Export
// =============================================================================

export const recentProjects = {
  get: getRecentProjects,
  getAll: getRecentProjects, // Alias for consistency
  add: addToRecent,
  remove: removeFromRecent,
  updateName: updateProjectName,
  updateThumbnail: updateProjectThumbnail,
  clear: clearRecentProjects,
}
