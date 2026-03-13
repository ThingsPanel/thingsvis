/**
 * File System Access API Fallback
 * 
 * Provides fallback implementations for browsers that don't support
 * the File System Access API.
 */

// =============================================================================
// Types
// =============================================================================

export interface SaveFileOptions {
  /** Suggested filename */
  suggestedName?: string
  /** File types to accept */
  types?: Array<{
    description: string
    accept: Record<string, string[]>
  }>
}

export interface OpenFileOptions {
  /** File types to accept */
  types?: Array<{
    description: string
    accept: Record<string, string[]>
  }>
  /** Whether to allow multiple file selection */
  multiple?: boolean
}

// =============================================================================
// Feature Detection
// =============================================================================

/**
 * Check if the File System Access API is available
 */
export function hasFileSystemAccess(): boolean {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window
}

// =============================================================================
// Save File
// =============================================================================

/**
 * Save a file using the File System Access API with fallback
 */
export async function saveFile(
  blob: Blob,
  options: SaveFileOptions = {}
): Promise<void> {
  if (hasFileSystemAccess()) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: options.suggestedName,
        types: options.types,
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (err: any) {
      // User cancelled or API failed, fall through to fallback
      if (err.name === 'AbortError') {
        return // User cancelled
      }
    }
  }

  // Fallback: Create download link
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = options.suggestedName || 'download'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// =============================================================================
// Open File
// =============================================================================

/**
 * Open a file using the File System Access API with fallback
 */
export async function openFile(
  options: OpenFileOptions = {}
): Promise<File | null> {
  if (hasFileSystemAccess()) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: options.types,
        multiple: false,
      })
      return await handle.getFile()
    } catch (err: any) {
      // User cancelled or API failed, fall through to fallback
      if (err.name === 'AbortError') {
        return null // User cancelled
      }
    }
  }

  // Fallback: Create file input
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    
    if (options.types) {
      // Convert types to accept string
      const extensions = options.types
        .flatMap(t => Object.values(t.accept).flat())
        .join(',')
      input.accept = extensions
    }

    input.onchange = () => {
      const file = input.files?.[0] || null
      resolve(file)
    }

    input.oncancel = () => {
      resolve(null)
    }

    input.click()
  })
}

// =============================================================================
// Project File Options
// =============================================================================

/**
 * Default file options for ThingsVis project files
 */
export const PROJECT_FILE_OPTIONS = {
  types: [
    {
      description: 'ThingsVis Project',
      accept: {
        'application/json': ['.thingsvis', '.json'],
      },
    },
  ],
}

/**
 * Save a ThingsVis project file
 */
export async function saveProjectFile(
  blob: Blob,
  projectName: string
): Promise<void> {
  await saveFile(blob, {
    suggestedName: `${projectName}.thingsvis`,
    types: PROJECT_FILE_OPTIONS.types,
  })
}

/**
 * Open a ThingsVis project file
 */
export async function openProjectFile(): Promise<File | null> {
  return await openFile(PROJECT_FILE_OPTIONS)
}
