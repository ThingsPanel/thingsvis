/**
 * WidgetModeStrategy  Host-managed Mode
 *
 * Responsibilities:
 * 1. bootstrap: Awaits the 	v:init message from the Host.
 * 2. save: Sends 	v:save to the Host via postMessage.
 * 3. listeners: Handles real-time pushes (e.g., config updates, schema changes).
 *
 * @important Do not import any Cloud API or storage adapter modules.
 */

import type { EditorStrategy, UIVisibilityConfig } from './EditorStrategy';
import type { ProjectFile } from '../lib/storage/schemas';
import { messageRouter, MSG_TYPES } from '../embed/message-router';
import { usePlatformFieldStore, type PlatformFieldItem } from '../lib/stores/platformFieldStore';
import { usePlatformDeviceStore } from '../lib/stores/platformDeviceStore';
import { normalizePlatformFieldScope } from '../lib/embedded/default-platform-fields';
import { dataSourceManager } from '@thingsvis/kernel';
import { DEFAULT_PLATFORM_FIELD_CONFIG } from '@thingsvis/schema';
// =============================================================================
// Interfaces & Types
// =============================================================================

import { type PlatformDevice } from '../lib/stores/platformDeviceStore';

export interface EmbedInitPayload {
  projectId?: string;
  projectName?: string;
  thumbnail?: string;
  canvas?: {
    mode?: string;
    width?: number;
    height?: number;
    background?: string;
    gridCols?: number;
    gridRowHeight?: number;
    gridGap?: number;
    fullWidthPreview?: boolean;
  };
  nodes?: Record<string, unknown>[];
  dataSources?: Record<string, unknown>[];
  platformFieldScope?: string;
  roleScope?: string;
  platformFields?: PlatformFieldItem[];
  platformDevices?: PlatformDevice[];
  [key: string]: unknown;
}

// =============================================================================
// Strategy Implementation
// =============================================================================

export class WidgetModeStrategy implements EditorStrategy {
  readonly mode = 'widget' as const;

  private initResolve: ((data: ProjectFile | null) => void) | null = null;
  private initTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Bootstrap: Wait for the Host to send initialization data.
   * Returns a Promise that resolves when the init message is received.
   * If the Host fails to send within the timeout, resolves to null to create an empty project.
   */
  async bootstrap(_projectId: string): Promise<ProjectFile | null> {
    return new Promise<ProjectFile | null>((resolve) => {
      this.initResolve = resolve;

      // Handle the 'init' event from the host
      messageRouter.on(MSG_TYPES.INIT, this.handleInitEvent);

      // 30-second timeout for initialization
      this.initTimeout = setTimeout(() => {
        if (this.initResolve) {
          console.warn('[WidgetModeStrategy] Init timeout, creating empty project');
          this.finishInit(null);
        }
      }, 30000);
    });
  }

  private handleInitEvent = (rawPayload: unknown) => {
    // The message-router now unpacks payload?.data automatically or passes payload raw.
    // We handle nested data structures just in case legacy implementations passed it via { data: { ... } }
    const parsedPayload = (rawPayload as { data?: unknown }).data || rawPayload;
    const payload = parsedPayload as EmbedInitPayload;

    if (!payload || typeof payload !== 'object') {
      console.warn('[WidgetModeStrategy] Invalid init payload received');
      this.finishInit(null);
      return;
    }

    // 1. Inject the implicit Platform Data Source (Legacy default)
    dataSourceManager.registerDataSource({
      id: '__platform__',
      name: 'System Platform',
      type: 'PLATFORM_FIELD',
      config: {
        ...DEFAULT_PLATFORM_FIELD_CONFIG,
        source: 'plugin-identifier',
        requestedFields: (payload.platformFields || [])
          .map((field: any) => field?.id)
          .filter((id: unknown) => typeof id === 'string'),
      },
    });

    // 1.5 Inject per-device Data Sources if platformDevices are provided (Multi-device Phase 4)
    if (Array.isArray(payload.platformDevices)) {
      payload.platformDevices.forEach((device) => {
        if (!device.deviceId) return;
        dataSourceManager.registerDataSource({
          id: `__platform_${device.deviceId}__`,
          name: device.deviceName || `Device ${device.deviceId}`,
          type: 'PLATFORM_FIELD',
          config: {
            ...DEFAULT_PLATFORM_FIELD_CONFIG,
            source: 'plugin-identifier',
            deviceId: device.deviceId,
          },
        });
      });
      // Store devices in kernel state (to be used by LeftPanel DeviceLibrary)
      usePlatformDeviceStore.getState().setDevices(payload.platformDevices);
    }

    // 2. Process Platform Fields provided by Host
    usePlatformFieldStore
      .getState()
      .setScope(normalizePlatformFieldScope(payload.platformFieldScope || payload.roleScope));

    if (Array.isArray(payload.platformFields)) {
      usePlatformFieldStore.getState().setFields(payload.platformFields);
    }

    // 3. Construct the internal ProjectFile state
    const projectFile: ProjectFile = {
      meta: {
        version: '1.0.0',
        id: payload.projectId || 'new-project',
        name: payload.projectName || 'Untitled',
        thumbnail: payload.thumbnail,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      canvas: {
        mode: (payload.canvas?.mode || 'fixed') as 'fixed' | 'infinite' | 'grid',
        width: payload.canvas?.width || 1920,
        height: payload.canvas?.height || 1080,
        background: payload.canvas?.background || '#ffffff',
        gridCols: payload.canvas?.gridCols,
        gridRowHeight: payload.canvas?.gridRowHeight,
        gridGap: payload.canvas?.gridGap,
        fullWidthPreview: payload.canvas?.fullWidthPreview,
      },
      nodes: payload.nodes || [],
      dataSources: (payload.dataSources || []) as {
        type: string;
        id: string;
        config: Record<string, unknown>;
      }[],
    };

    this.finishInit(projectFile);
  };

  private finishInit(data: ProjectFile | null) {
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
      this.initTimeout = null;
    }

    if (this.initResolve) {
      this.initResolve(data);
      this.initResolve = null;
    }

    messageRouter.off(MSG_TYPES.INIT, this.handleInitEvent);
  }

  /**
   * Save: Send the saved state data to the Host via postMessage.
   */
  async save(projectState: ProjectFile): Promise<void> {
    const exportData = {
      canvas: projectState.canvas,
      nodes: projectState.nodes,
      dataSources: projectState.dataSources,
      thumbnail: projectState.meta.thumbnail,
      meta: {
        ...projectState.meta,
      },
    };

    messageRouter.send(MSG_TYPES.HOST_SAVE, exportData);
  }

  /**
   * Register real-time data push listeners.
   */
  setupListeners(): () => void {
    const handleUpdateSchema = (rawPayload: unknown) => {
      const payload = rawPayload as { payload?: PlatformFieldItem[] } | PlatformFieldItem[];
      const fields = ('payload' in payload ? payload.payload : payload) || [];

      if (Array.isArray(fields)) {
        usePlatformFieldStore.getState().setFields(fields);
      }
    };

    const handleUpdateData = (rawPayload: unknown) => {
      const payload = rawPayload as Record<string, unknown>;
      const data = (payload.payload || payload.data || payload || {}) as Record<string, unknown>;

      if (!data || typeof data !== 'object') return;

      // Bridge updates to PlatformFieldAdapter via native window event
      Object.entries(data).forEach(([fieldId, value]) => {
        window.postMessage(
          {
            type: MSG_TYPES.PLATFORM_DATA,
            payload: { fieldId, value, timestamp: Date.now() },
          },
          '*',
        );
      });
    };

    // Assign hooks
    const cleanupSchema = messageRouter.on('updateSchema', handleUpdateSchema);
    const cleanupData = messageRouter.on('updateData', handleUpdateData);
    // Note: we can't use MSG_TYPES safely for 'updateSchema' or 'updateData' since they were missing from the old MSG_TYPES,
    // so we stick to the literal strings that were present in the old implementation ('updateSchema', 'updateData').

    return () => {
      messageRouter.off('updateSchema', handleUpdateSchema);
      messageRouter.off('updateData', handleUpdateData);
      if (cleanupSchema) cleanupSchema();
      if (cleanupData) cleanupData();
    };
  }

  getUIVisibility(): UIVisibilityConfig {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    return {
      showLibrary: params.get('showLibrary') !== '0',
      showProps: params.get('showProps') !== '0',
      showTopLeft: params.get('showTopLeft') !== '0',
      showToolbar: params.get('showToolbar') !== '0',
      showTopRight: params.get('showTopRight') !== '0',
      hideProjectDialog: true, // Hide project selection dialog in embedded mode
    };
  }

  dispose(): void {
    this.finishInit(null);
  }
}
