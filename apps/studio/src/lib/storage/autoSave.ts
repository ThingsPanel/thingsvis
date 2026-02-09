/**
 * Auto-Save Manager
 * 
 * Manages automatic saving with debounce and periodic timers.
 * Provides save status tracking and subscription for UI updates.
 */

import type { ProjectFile } from './schemas'
import type { SaveState, SaveStateListener, AutoSaveConfig } from './types'
import { projectStorage } from './projectStorage'
import { STORAGE_CONSTANTS } from './constants'

// =============================================================================
// Auto-Save Manager Implementation
// =============================================================================

export class AutoSaveManager {
  private projectId: string | null = null
  private getState: (() => ProjectFile) | null = null
  private saveFn: (project: ProjectFile) => Promise<void> = projectStorage.save
  private debounceTimer: number | null = null
  private periodicTimer: number | null = null
  private isDirty = false
  private listeners = new Set<SaveStateListener>()
  private config: Required<AutoSaveConfig>
  private currentState: SaveState = {
    status: 'idle',
    lastSavedAt: null,
    error: null,
  }

  constructor(config: AutoSaveConfig = {}) {
    this.config = {
      debounceDelay: config.debounceDelay ?? STORAGE_CONSTANTS.DEBOUNCE_DELAY_MS,
      periodicInterval: config.periodicInterval ?? STORAGE_CONSTANTS.PERIODIC_INTERVAL_MS,
      warnOnUnload: config.warnOnUnload ?? true,
    }
    this.handleUnload = this.handleUnload.bind(this)
  }

  /**
   * Initialize auto-save with project ID and state getter.
   */
  init(
    projectId: string,
    getState: () => ProjectFile,
    saveFn?: (project: ProjectFile) => Promise<void>
  ): void {
    console.log('[AutoSave] init() called, projectId:', projectId, 'wasDirty:', this.isDirty);
    
    // 保存当前的 dirty 状态，如果是同一个项目的重新初始化，保留 dirty 状态
    const wasDirty = this.isDirty && this.projectId === projectId
    
    this.destroy() // Clean up any existing timers

    this.projectId = projectId
    this.getState = getState
    this.saveFn = saveFn ?? projectStorage.save
    
    // 如果是同一个项目且之前是 dirty 状态，保留 dirty
    this.isDirty = wasDirty
    if (wasDirty) {
      this.updateStatus({ status: 'dirty', lastSavedAt: null, error: null })
      // 重新调度保存
      this.debounceTimer = window.setTimeout(() => {
        console.log('[AutoSave] re-scheduled debounce timer fired');
        this.saveNow()
      }, this.config.debounceDelay)
    } else {
      this.updateStatus({ status: 'idle', lastSavedAt: null, error: null })
    }

    // Start periodic timer
    this.periodicTimer = window.setInterval(() => {
      if (this.isDirty) {
        this.saveNow()
      }
    }, this.config.periodicInterval)

    // Handle page unload
    if (this.config.warnOnUnload) {
      window.addEventListener('beforeunload', this.handleUnload)
    }
  }

  /**
   * Mark state as dirty and schedule debounced save.
   * Called on every state change.
   */
  markDirty(): void {
    console.log('[AutoSave] markDirty() called, scheduling save in', this.config.debounceDelay, 'ms');
    this.isDirty = true
    this.updateStatus({ ...this.currentState, status: 'dirty' })

    // Cancel existing debounce timer
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer)
    }

    // Schedule new debounced save
    this.debounceTimer = window.setTimeout(() => {
      console.log('[AutoSave] debounce timer fired, calling saveNow()');
      this.saveNow()
    }, this.config.debounceDelay)
  }

  /**
   * Force immediate save, bypassing debounce.
   * Called on Ctrl+S or before unload.
   */
  /**
   * Save now with retry logic (exponential backoff, up to 3 attempts)
   */
  async saveNow(): Promise<void> {
    console.log('[AutoSave] saveNow() called, isDirty:', this.isDirty, 'projectId:', this.projectId);
    
    // Cancel pending debounce
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    if (!this.getState || !this.projectId) {
      console.warn('[AutoSave] saveNow() aborted: missing getState or projectId');
      return
    }

    // Skip if not dirty and we've saved before
    if (!this.isDirty && this.currentState.lastSavedAt !== null) {
      return
    }

    let attempt = 0
    const maxAttempts = 3
    let lastError: any = null
    let delay = 300

    while (attempt < maxAttempts) {
      try {
        this.updateStatus({ ...this.currentState, status: 'saving', error: null })
        const project = this.getState()
        
        await this.saveFn(project)
        
        this.isDirty = false
        const savedAt = Date.now()
        this.updateStatus({ status: 'saved', lastSavedAt: savedAt, error: null })
        // Return to idle after showing "saved" briefly
        setTimeout(() => {
          if (this.currentState.status === 'saved') {
            this.updateStatus({ ...this.currentState, status: 'idle' })
          }
        }, STORAGE_CONSTANTS.SAVED_DISPLAY_MS)
        return
      } catch (error) {
        
        lastError = error
        attempt++
        if (attempt < maxAttempts) {
          // Exponential backoff
          await new Promise(res => setTimeout(res, delay))
          delay *= 2
        }
      }
    }
    // If we reach here, all attempts failed
    const message = lastError instanceof Error ? lastError.message : 'Unknown error'
    this.updateStatus({ ...this.currentState, status: 'error', error: `Save failed after ${maxAttempts} attempts: ${message}` })
  }

  /**
   * Get current save state for UI display.
   * Returns the same object reference for useSyncExternalStore compatibility.
   */
  getStatus(): SaveState {
    return this.currentState
  }

  /**
   * Subscribe to save state changes.
   * Returns unsubscribe function.
   */
  subscribe(listener: SaveStateListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Stop all timers and cleanup.
   */
  destroy(): void {
    console.log('[AutoSave] destroy() called, isDirty:', this.isDirty, 'projectId:', this.projectId);
    
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    if (this.periodicTimer !== null) {
      clearInterval(this.periodicTimer)
      this.periodicTimer = null
    }

    window.removeEventListener('beforeunload', this.handleUnload)

    this.projectId = null
    this.getState = null
    this.saveFn = projectStorage.save
    this.isDirty = false
    this.listeners.clear()
  }

  /**
   * Check if there are unsaved changes.
   */
  hasUnsavedChanges(): boolean {
    return this.isDirty
  }

  /**
   * Update status and notify listeners.
   */
  private updateStatus(state: SaveState): void {
    this.currentState = state
    for (const listener of this.listeners) {
      try {
        listener(state)
      } catch (error) {
        
      }
    }
  }

  /**
   * Handle beforeunload event.
   */
  private handleUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty) {
      event.preventDefault()
      // Modern browsers show a generic message
      event.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const autoSaveManager = new AutoSaveManager()
