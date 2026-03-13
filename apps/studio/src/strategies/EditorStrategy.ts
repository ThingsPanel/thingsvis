/**
 * EditorStrategy Interface
 *
 * Defines the common interface for two modes of the Editor:
 *
 * - AppModeStrategy: Cloud mode, self-managed data (Cloud API).
 * - WidgetModeStrategy: Host mode, host-managed data (postMessage).
 *
 * EditorShell.tsx uses 'useEditorStrategy()' to acquire the concrete strategy instance,
 * enabling physical isolation  Widget files cannot import the Cloud API, and vice versa.
 */

import type { ProjectFile } from '../lib/storage/schemas';

// =============================================================================
// UI Visibility Configuration
// =============================================================================

export interface UIVisibilityConfig {
  /** Determines if the component library panel is shown */
  showLibrary: boolean;
  /** Determines if the property configuration panel is shown */
  showProps: boolean;
  /** Determines if the top-left toolbar (project name/title) is shown */
  showTopLeft: boolean;
  /** Determines if the top toolbar is shown */
  showToolbar: boolean;
  /** Determines if the top-right toolbar (save/publish buttons) is shown */
  showTopRight: boolean;
  /** Determines if the project selection dialog is hidden */
  hideProjectDialog: boolean;
}

// =============================================================================
// Strategy Interface
// =============================================================================

export interface EditorStrategy {
  /** Mode identifier */
  readonly mode: 'app' | 'widget';

  /**
   * Initialization: Load project data.
   * - AppMode: Load from Cloud API.
   * - WidgetMode: Await Host postMessage.
   *
   * @returns Loaded project data, or null indicating a new project.
   */
  bootstrap(projectId: string): Promise<ProjectFile | null>;

  /**
   * Save: Persist the current state.
   * - AppMode: Save via Cloud API (driven by useAutoSave).
   * - WidgetMode: Send to Host via postMessage.
   */
  save(projectState: ProjectFile): Promise<void>;

  /**
   * Get UI visibility configuration.
   * - AppMode: Determined by embedded parameters.
   * - WidgetMode: Determined by URL parameters.
   */
  getUIVisibility(): UIVisibilityConfig;

  /**
   * Register event listeners (e.g., data injection, field updates).
   * Returns a cleanup function.
   */
  setupListeners?(): () => void;

  /**
   * Cleanup: Release resources upon unmounting.
   * - WidgetMode: Remove message listeners.
   */
  dispose(): void;
}
