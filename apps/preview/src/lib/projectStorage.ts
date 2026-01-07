/**
 * Project Storage for Preview App
 * 
 * Read-only access to projects stored in IndexedDB.
 * This module allows the preview app to load projects saved by the studio.
 */

import { createStore, get } from 'idb-keyval'

// Constants must match studio's storage constants
const DB_NAME = 'thingsvis-projects'
const PROJECTS_STORE = 'projects'

// Create custom store for projects (same as studio)
const projectsStore = createStore(DB_NAME, PROJECTS_STORE)

// =============================================================================
// Types (simplified from studio's schemas)
// =============================================================================

export interface ProjectMeta {
  version: string
  id: string
  name: string
  thumbnail?: string
  createdAt: number
  updatedAt: number
}

export interface CanvasConfig {
  mode: 'fixed' | 'infinite' | 'reflow'
  width: number
  height: number
  background: string
  gridEnabled: boolean
  gridSize: number
}

export interface ProjectFile {
  meta: ProjectMeta
  canvas: CanvasConfig
  nodes: any[]
  dataSources: any[]
}

// =============================================================================
// Project Loading
// =============================================================================

/**
 * Load project from IndexedDB by ID.
 * Returns null if project not found.
 */
export async function loadProject(projectId: string): Promise<ProjectFile | null> {
  try {
    const project = await get<ProjectFile>(projectId, projectsStore)
    return project ?? null
  } catch (error) {
    console.error('[preview] Failed to load project:', error)
    return null
  }
}

/**
 * Check if a project exists in IndexedDB.
 */
export async function projectExists(projectId: string): Promise<boolean> {
  try {
    const project = await get<ProjectFile>(projectId, projectsStore)
    return project !== undefined
  } catch {
    return false
  }
}
