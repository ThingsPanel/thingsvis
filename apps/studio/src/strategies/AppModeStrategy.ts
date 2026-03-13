/**
 * AppModeStrategy  Cloud / Standalone execution mode
 *
 * Responsibilities:
 * 1. bootstrap: Load project from Cloud API or IndexedDB.
 * 2. save: Driven by the useAutoSave hook, persisted via storage adapter.
 * 3. UI: Determines visibility based on embedding status.
 *
 * @important Do not import any embed/postMessage related modules.
 */

import type { EditorStrategy, UIVisibilityConfig } from './EditorStrategy';
import type { ProjectFile } from '../lib/storage/schemas';
import type { StorageAdapter, StorageProject } from '../lib/storage/adapter';
import { projectStorage } from '../lib/storage/projectStorage';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Converts StorageProject (Cloud API schema) to ProjectFile (Internal editor schema)
 */
function toProjectFile(sp: StorageProject): ProjectFile {
  return {
    meta: {
      version: '1.0.0',
      id: sp.meta.id,
      name: sp.meta.name,
      thumbnail: sp.meta.thumbnail,
      projectId: sp.meta.projectId,
      projectName: sp.meta.projectName,
      createdAt: sp.meta.createdAt,
      updatedAt: sp.meta.updatedAt,
    },
    canvas: sp.schema.canvas,
    nodes: sp.schema.nodes,
    dataSources: sp.schema.dataSources,
    variables:
      ((sp.schema as Record<string, unknown>).variables as Record<string, unknown>[]) || [],
  };
}

// =============================================================================
// Strategy Implementation
// =============================================================================

export class AppModeStrategy implements EditorStrategy {
  readonly mode = 'app' as const;

  private cloudAdapter: StorageAdapter | null = null;
  private isEmbedded: boolean;

  constructor(
    options: {
      cloudAdapter?: StorageAdapter;
      isEmbedded?: boolean;
    } = {},
  ) {
    this.cloudAdapter = options.cloudAdapter ?? null;
    this.isEmbedded = options.isEmbedded ?? false;
  }

  async bootstrap(projectId: string): Promise<ProjectFile | null> {
    if (this.cloudAdapter) {
      try {
        const cloudProject = await this.cloudAdapter.get(projectId);
        if (cloudProject) {
          return toProjectFile(cloudProject);
        }
        return null;
      } catch (err) {
        console.error('[AppModeStrategy] Cloud load failed:', err);
        return null;
      }
    }

    return projectStorage.load(projectId);
  }

  async save(projectState: ProjectFile): Promise<void> {
    if (this.cloudAdapter) {
      const storageProject: StorageProject = {
        meta: {
          id: projectState.meta.id,
          name: projectState.meta.name,
          thumbnail: projectState.meta.thumbnail,
          createdAt: projectState.meta.createdAt,
          updatedAt: Date.now(),
        },
        schema: {
          canvas: projectState.canvas,
          nodes: projectState.nodes,
          dataSources: projectState.dataSources,
          variables: projectState.variables,
        },
      };
      await this.cloudAdapter.save(storageProject);
    } else {
      await projectStorage.save(projectState);
    }
  }

  getUIVisibility(): UIVisibilityConfig {
    if (this.isEmbedded) {
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
      return {
        showLibrary: params.get('showLibrary') !== '0',
        showProps: params.get('showProps') !== '0',
        showTopLeft: params.get('showTopLeft') !== '0',
        showToolbar: params.get('showToolbar') !== '0',
        showTopRight: params.get('showTopRight') !== '0',
        hideProjectDialog: true,
      };
    }

    return {
      showLibrary: true,
      showProps: true,
      showTopLeft: true,
      showToolbar: true,
      showTopRight: true,
      hideProjectDialog: false,
    };
  }

  dispose(): void {
    // No specific cleanup required for App Mode
  }
}
