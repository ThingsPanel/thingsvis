/**
 * Project Storage Service
 * 
 * IndexedDB-based project persistence using idb-keyval.
 * Handles project CRUD operations and export/import functionality.
 */

import { createStore, get, set, del, keys } from 'idb-keyval'
import { ProjectFileSchema, type ProjectFile, type RecentProjectEntry } from './schemas'
import { STORAGE_CONSTANTS } from './constants'
import { recentProjects } from './recentProjects'

// Create custom store for projects
const projectsStore = createStore(
  STORAGE_CONSTANTS.DB_NAME,
  STORAGE_CONSTANTS.PROJECTS_STORE
)

// =============================================================================
// Error Types
// =============================================================================

export class ImportError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'ImportError'
  }
}

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

// =============================================================================
// Project Storage Implementation
// =============================================================================

/**
 * Save project to IndexedDB.
 * Also updates recent projects list in localStorage.
 */
export async function saveProject(project: ProjectFile): Promise<void> {
  try {
    // Update the timestamp
    const updatedProject: ProjectFile = {
      ...project,
      meta: {
        ...project.meta,
        updatedAt: Date.now(),
      },
    }

    await set(project.meta.id, updatedProject, projectsStore)

    // Update recent projects list
    recentProjects.add({
      id: updatedProject.meta.id,
      name: updatedProject.meta.name,
      thumbnail: updatedProject.meta.thumbnail || '',
      updatedAt: updatedProject.meta.updatedAt,
    })

    // Track the last opened project for restore-on-reload
    try {
      localStorage.setItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY, updatedProject.meta.id)
    } catch {
      // ignore storage quota / privacy mode errors
    }
  } catch (error) {
    throw new StorageError('Failed to save project', error)
  }
}

/**
 * Load project from IndexedDB by ID.
 * Returns null if project not found.
 */
export async function loadProject(projectId: string): Promise<ProjectFile | null> {
  try {
    const project = await get<ProjectFile>(projectId, projectsStore)
    return project ?? null
  } catch (error) {
    throw new StorageError('Failed to load project', error)
  }
}

/**
 * Delete project from IndexedDB.
 * Also removes from recent projects list.
 */
export async function deleteProject(projectId: string): Promise<void> {
  try {
    await del(projectId, projectsStore)
    recentProjects.remove(projectId)
  } catch (error) {
    throw new StorageError('Failed to delete project', error)
  }
}

/**
 * Check if project exists in IndexedDB.
 */
export async function projectExists(projectId: string): Promise<boolean> {
  try {
    const allKeys = await keys<string>(projectsStore)
    return allKeys.includes(projectId)
  } catch (error) {
    throw new StorageError('Failed to check project existence', error)
  }
}

/**
 * Get all project IDs from IndexedDB.
 */
export async function getAllProjectIds(): Promise<string[]> {
  try {
    return await keys<string>(projectsStore)
  } catch (error) {
    throw new StorageError('Failed to get project IDs', error)
  }
}

// =============================================================================
// Export/Import Functions
// =============================================================================

/**
 * Export project as downloadable JSON blob.
 */
export function exportAsBlob(project: ProjectFile): Blob {
  const json = JSON.stringify(project, null, 2)
  return new Blob([json], { type: STORAGE_CONSTANTS.MIME_TYPE })
}

/**
 * Download project as a .thingsvis file.
 */
export function downloadProject(project: ProjectFile): void {
  const blob = exportAsBlob(project)
  const url = URL.createObjectURL(blob)
  const filename = `${project.meta.name}${STORAGE_CONSTANTS.FILE_EXTENSION}`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Import project from uploaded JSON file.
 * Validates the file format and returns parsed project.
 * Throws ImportError if validation fails.
 */
export async function importFromFile(file: File): Promise<ProjectFile> {
  // Check file extension
  if (!file.name.endsWith(STORAGE_CONSTANTS.FILE_EXTENSION) && !file.name.endsWith('.json')) {
    throw new ImportError(
      `Invalid file type. Expected ${STORAGE_CONSTANTS.FILE_EXTENSION} or .json file.`,
      'filename'
    )
  }

  // Read file content
  let content: string
  try {
    content = await file.text()
  } catch (error) {
    throw new ImportError('Failed to read file content', 'file', error)
  }

  // Parse JSON
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (error) {
    throw new ImportError('Invalid JSON format', 'content', error)
  }

  // Validate schema
  const result = ProjectFileSchema.safeParse(parsed)
  if (!result.success) {
    const firstError = result.error.errors[0]
    throw new ImportError(
      `Invalid project file: ${firstError?.message ?? 'Unknown error'}`,
      firstError?.path.join('.'),
      result.error.errors
    )
  }

  return result.data
}

// =============================================================================
// Project Factory
// =============================================================================

/**
 * Create a new project with default values.
 */
export function createNewProject(name = 'Untitled Project'): ProjectFile {
  const now = Date.now()
  const id = crypto.randomUUID()

  return {
    meta: {
      version: '1.0.0',
      id,
      name,
      createdAt: now,
      updatedAt: now,
    },
    canvas: {
      mode: 'fixed',
      width: 1920,
      height: 1080,
      background: '#ffffff',
    },
    nodes: [],
    dataSources: [],
  }
}

// =============================================================================
// Singleton Export
// =============================================================================

export const projectStorage = {
  save: saveProject,
  load: loadProject,
  delete: deleteProject,
  exists: projectExists,
  getAllIds: getAllProjectIds,
  exportAsBlob,
  download: downloadProject,
  importFromFile,
  createNew: createNewProject,
}
