/**
 * Cross-Frame Message Router
 *
 * Provides bidirectional communication between ThingsVis (iframe) and its Host platform.
 */

// =============================================================================
// Settings
// =============================================================================

const TV_VERSION = '2.0.0';
const IS_DEBUG = process.env.NODE_ENV === 'development';

export function isEmbedMode(): boolean {
  if (typeof window === 'undefined') return false;
  if (window !== window.parent) return true;
  return new URLSearchParams(window.location.hash.split('?')[1] || '').get('mode') === 'embedded';
}

// =============================================================================
// Message Types
// =============================================================================

export const MSG_TYPES = {
  // Host -> Guest (Editor)
  INIT: 'tv:init',
  TRIGGER_SAVE: 'tv:trigger-save',
  REQUEST_SAVE: 'tv:request-save',
  EDITOR_EVENT: 'tv:event',

  // Guest -> Host
  HOST_SAVE: 'tv:save',
  READY: 'tv:ready',
  REQUEST_INIT: 'tv:request-init',

  // Viewer (Host -> Guest)
  LOAD_DASHBOARD: 'LOAD_DASHBOARD',
  UPDATE_VARIABLES: 'UPDATE_VARIABLES',
  SET_TOKEN: 'SET_TOKEN',
  VIEWER_READY: 'READY',

  // Viewer (Guest -> Host)
  LOADED: 'LOADED',
  ERROR: 'ERROR',

  // Internal
  PLATFORM_DATA: 'tv:platform-data',
  /** Host -> Guest: bulk-fill the ring buffer for a single field with historical records. */
  PLATFORM_HISTORY: 'tv:platform-history',
  /** ThingsVis -> Host: write a field value back to the host platform. */
  PLATFORM_WRITE: 'tv:platform-write',
} as const;

export type MessageType = (typeof MSG_TYPES)[keyof typeof MSG_TYPES];

export interface BaseMessage {
  type: string;
  source: 'thingsvis' | 'host';
  tvVersion: string;
  [key: string]: unknown;
}

export interface InboundMessage extends BaseMessage {
  source: 'host';
}

export interface OutboundMessage extends BaseMessage {
  source: 'thingsvis';
}

const DEFAULT_EMBED_NODE_POSITION = { x: 100, y: 100 } as const;
const DEFAULT_EMBED_NODE_SIZE = { width: 200, height: 80 } as const;
type PreviewScaleMode = 'fit-min' | 'fit-width' | 'fit-height' | 'stretch' | 'original';
type PreviewAlignY = 'top' | 'center';

type MessageHandler<T = unknown> = (data: T) => void;

class MessageRouter {
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private hostOrigin: string = '*'; // Default to any, can be restricted later if needed
  private isListening = false;

  constructor() {
    this.ensureListener();
  }

  private ensureListener() {
    if (this.isListening || typeof window === 'undefined') return;
    window.addEventListener('message', this.handleMessage);
    this.isListening = true;
  }

  public init() {
    this.ensureListener();

    // Fallback: If not in iframe, no need to init router
    if (!isEmbedMode()) return;

    // Notify host that ThingsVis is ready
    this.send(MSG_TYPES.READY, { status: 'ok' });
  }

  public dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.handleMessage);
    }
    this.isListening = false;
    this.handlers.clear();
  }

  public on<T = unknown>(type: string, handler: MessageHandler<T>) {
    this.ensureListener();
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)?.add(handler as MessageHandler);

    // Return a cleanup function
    return () => {
      this.off(type, handler);
    };
  }

  public off<T = unknown>(type: string, handler: MessageHandler<T>) {
    this.handlers.get(type)?.delete(handler as MessageHandler);
  }

  public send(type: string, payload: unknown = {}) {
    if (!isEmbedMode() || typeof window === 'undefined') return;

    // We no longer strictly enforce wrapping with OutboundMessage structure because
    // some legacy integrations might expect a plain payload at the root level.
    // However, we still inject the core fields.
    const message = {
      type,
      payload,
      source: 'thingsvis',
      tvVersion: TV_VERSION,
    };

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, this.hostOrigin);
    }
  }

  private handleMessage = (event: MessageEvent) => {
    // We do NOT strictly block 'self' messages here because Viewer mode uses 'tv:platform-data' internally
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    const type = data.type as string;
    if (!type) return;

    // Determine payload: sometimes it's nested in .payload, sometimes it's at the root
    const payload = data.payload !== undefined ? data.payload : data;

    // Fire handlers for the specific message type
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }

    // Unpack 'tv:event' wrappers to support legacy host integration (e.g. 'updateData')
    if (type === MSG_TYPES.EDITOR_EVENT) {
      const p = payload as Record<string, unknown>;
      const inner = p?.payload as Record<string, unknown> | undefined;
      let eventName: string | undefined;
      if (typeof p?.event === 'string') eventName = p.event;
      else if (typeof inner?.event === 'string') eventName = inner.event;

      if (eventName) {
        const subHandlers = this.handlers.get(eventName);
        if (subHandlers) {
          subHandlers.forEach((handler) => handler(payload));
        }
      }
    }
  };
}

export const messageRouter = new MessageRouter();

// =============================================================================
// Helper Wrappers
// =============================================================================

export function requestSave(payload: unknown) {
  messageRouter.send(MSG_TYPES.HOST_SAVE, payload);
}

let _embedToken: string | null = null;

export function getConfiguredEmbedToken(): string | null {
  return _embedToken;
}

/**
 * Configure the API client with a token/baseUrl from the embed URL params.
 * Called from main.tsx before React renders to avoid race conditions.
 */
export function configureEmbedApiClient(token?: string, baseUrl?: string): void {
  // Lazy import to avoid circular deps at module evaluation time
  import('../lib/api/client').then(({ apiClient }) => {
    if (token !== undefined) _embedToken = token;
    apiClient.configure({
      ...(token !== undefined ? { getToken: () => _embedToken } : {}),
      ...(baseUrl ? { baseUrl } : {}),
    });
  });
}

export function notifyChange(hasUnsavedChanges: boolean) {
  messageRouter.send('tv:change', { hasUnsavedChanges });
}

/** Short event name → full message type mapping (backward compat) */
const EMBED_EVENT_ALIAS: Record<string, string> = {
  init: MSG_TYPES.INIT,
  triggerSave: MSG_TYPES.TRIGGER_SAVE,
};

export const onEmbedEvent = <T = unknown>(type: string, handler: MessageHandler<T>) => {
  const resolvedType = EMBED_EVENT_ALIAS[type] || type;
  return messageRouter.on(resolvedType, handler);
};

// =============================================================================
// Embed Init Payload Processing
// =============================================================================

export interface EmbedInitPayload {
  platformDeviceGroups?: unknown[];
  platformDevices?: unknown[];
  platformFields?: unknown[];
  platformBufferSize?: number;
  platformFieldScope?: string;
  roleScope?: string;
  data?: {
    meta?: { id?: string; name?: string; thumbnail?: string };
    canvas?: {
      mode?: string;
      width?: number;
      height?: number;
      theme?: string;
      scaleMode?: string;
      previewAlignY?: string;
      /** May be a CSS string or a PageBackground object { color, image, ... }. */
      background?: string | Record<string, unknown>;
      gridCols?: number;
      gridRowHeight?: number;
      gridGap?: number;
      fullWidthPreview?: boolean;
    };
    nodes?: unknown[];
    dataSources?: unknown[];
    platformFields?: unknown[];
  };
  config?: {
    saveTarget?: string;
    token?: string;
    apiBaseUrl?: string;
    apiConfig?: { baseURL?: string };
  };
}

export interface ProcessedEmbedData {
  projectId: string;
  projectName: string;
  hasExplicitCanvas: boolean;
  canvas: {
    mode: string;
    width: number;
    height: number;
    theme?: string;
    scaleMode: PreviewScaleMode;
    previewAlignY: PreviewAlignY;
    /** Explicit background only. When omitted, rendering falls back locally. */
    background?: string | Record<string, unknown>;
    gridCols: number;
    gridRowHeight: number;
    gridGap: number;
    fullWidthPreview: boolean;
  };
  nodes: NodeSchemaType[];
  dataSources: unknown[];
  saveTarget: SaveTarget;
  thumbnail?: string;
  platformFields: unknown[];
  platformDeviceGroups: unknown[];
  platformDevices: unknown[];
  platformBufferSize: number;
  platformFieldScope?: string;
}

function normalizeEmbedCanvasMode(mode: unknown): 'fixed' | 'infinite' | 'grid' {
  if (mode === 'fixed' || mode === 'infinite' || mode === 'grid') return mode;
  if (mode === 'reflow') return 'infinite';
  return 'fixed';
}

function normalizeEmbedCanvasScaleMode(mode: unknown): PreviewScaleMode {
  if (
    mode === 'fit-min' ||
    mode === 'fit-width' ||
    mode === 'fit-height' ||
    mode === 'stretch' ||
    mode === 'original'
  ) {
    return mode;
  }

  return 'fit-min';
}

function normalizeEmbedPreviewAlignY(value: unknown): PreviewAlignY {
  return value === 'top' ? 'top' : 'center';
}

export function processEmbedInitPayload(
  payload: EmbedInitPayload | unknown,
): ProcessedEmbedData | null {
  const p = payload as EmbedInitPayload;
  if (!p?.data) {
    console.warn('[EmbedInit] Invalid payload — missing data');
    return null;
  }

  const data = p.data;
  const config = p.config || {};
  const hasExplicitCanvas = Boolean(data.canvas && typeof data.canvas === 'object');

  const embedConfigToken =
    config.token || ((p as Record<string, unknown>).token as string | undefined);
  const embedApiBaseUrl =
    config.apiBaseUrl ||
    config.apiConfig?.baseURL ||
    ((p as Record<string, unknown>).apiBaseUrl as string | undefined);

  if (embedConfigToken || embedApiBaseUrl) {
    _embedToken = embedConfigToken ?? _embedToken;
    if (embedConfigToken) apiClient.configure({ getToken: () => _embedToken });
    if (embedApiBaseUrl) apiClient.configure({ baseUrl: embedApiBaseUrl });
  }

  const projectId = data.meta?.id || `embed-${Date.now()}`;
  const projectName = data.meta?.name || 'Embedded Project';
  const thumbnail = data.meta?.thumbnail;
  const saveTarget: SaveTarget = (config.saveTarget as SaveTarget) || 'self';

  updateEmbeddedConfig({ projectId, projectName, saveTarget });

  const canvas = {
    mode: normalizeEmbedCanvasMode(data.canvas?.mode),
    width: data.canvas?.width || 1920,
    height: data.canvas?.height || 1080,
    theme: typeof data.canvas?.theme === 'string' ? data.canvas.theme : undefined,
    scaleMode: normalizeEmbedCanvasScaleMode(data.canvas?.scaleMode),
    previewAlignY: normalizeEmbedPreviewAlignY(data.canvas?.previewAlignY),
    background: normalizeCanvasBackground(data.canvas?.background),
    gridCols: data.canvas?.gridCols ?? 24,
    gridRowHeight: data.canvas?.gridRowHeight ?? 50,
    gridGap: data.canvas?.gridGap ?? 5,
    fullWidthPreview: data.canvas?.fullWidthPreview ?? false,
  };

  const nodes = ((data.nodes || []) as Record<string, unknown>[]).map((rawNode, index) => {
    const normalizedNode = {
      id:
        typeof rawNode.id === 'string' && rawNode.id.length > 0
          ? rawNode.id
          : `node-${Date.now()}-${index}`,
      type: rawNode.type,
      position: rawNode.position ?? DEFAULT_EMBED_NODE_POSITION,
      size: rawNode.size ?? DEFAULT_EMBED_NODE_SIZE,
      props: rawNode.props ?? {},
      style: rawNode.style,
      baseStyle: rawNode.baseStyle,
      parentId: rawNode.parentId,
      data: rawNode.data ?? [],
      events: Array.isArray(rawNode.events) ? rawNode.events : undefined,
      grid: rawNode.grid,
      widgetVersion: rawNode.widgetVersion,
    };

    const result = NodeSchema.safeParse(normalizedNode);
    if (!result.success) {
      console.error('[EmbedInit] Invalid node in payload', {
        index,
        issues: result.error.issues,
        nodeId: normalizedNode.id,
      });
      throw new Error(`[EmbedInit] Invalid node at index ${index}`);
    }

    return result.data;
  });

  return {
    projectId,
    projectName,
    hasExplicitCanvas,
    canvas,
    nodes,
    dataSources: (data.dataSources || []) as unknown[],
    saveTarget,
    thumbnail,
    platformFields: (data.platformFields || p.platformFields || []) as unknown[],
    platformDeviceGroups: (p.platformDeviceGroups || []) as unknown[],
    platformDevices: (p.platformDevices || []) as unknown[],
    platformBufferSize:
      typeof p.platformBufferSize === 'number' && Number.isFinite(p.platformBufferSize)
        ? Math.max(0, Math.trunc(p.platformBufferSize))
        : 0,
    platformFieldScope:
      (typeof p.platformFieldScope === 'string' ? p.platformFieldScope : undefined) ||
      (typeof p.roleScope === 'string' ? p.roleScope : undefined),
  };
}

// =============================================================================
// Embed Mode Init (merged from embed-init.ts)
// =============================================================================

import {
  updateEmbeddedConfig,
  initSaveStrategy,
  type SaveTarget,
} from '../lib/storage/saveStrategy';
import { apiClient } from '../lib/api/client';
import { normalizeCanvasBackground } from '../lib/canvasBackground';
import { platformFieldStore } from '../lib/stores/platformFieldStore';
import { resolveEditorServiceConfig } from '../lib/embedded/service-config';
import { NodeSchema, type NodeSchemaType } from '@thingsvis/schema';

/**
 * Parse embed config from URL params and initialize the SaveStrategy.
 * Called from Editor.tsx on mount.
 */
export function initEmbedModeFromUrl(isAuthenticated: boolean): void {
  const hash = window.location.hash || '';
  const queryIndex = hash.indexOf('?');

  if (queryIndex >= 0) {
    const params = new URLSearchParams(hash.slice(queryIndex + 1));
    const saveTarget = params.get('saveTarget');
    const mode = params.get('mode');
    const token = params.get('token');

    if (mode === 'embedded') {
      if (token) {
        _embedToken = token;
        apiClient.configure({ getToken: () => _embedToken });
      }

      initSaveStrategy({
        isAuthenticated: isAuthenticated || !!token,
        embeddedProjectId: undefined,
      });

      if (saveTarget === 'host' || saveTarget === 'self') {
        updateEmbeddedConfig({ saveTarget: saveTarget as SaveTarget });
      }

      // Load platform fields from URL-injected service config (backward compat)
      const serviceConfig = resolveEditorServiceConfig();
      platformFieldStore.setScope(serviceConfig.platformFieldScope ?? 'all');
      if (serviceConfig.platformFields && serviceConfig.platformFields.length > 0) {
        platformFieldStore.setFields(serviceConfig.platformFields as never);
      }

      // Listen for dynamic schema updates from the host
      onEmbedEvent('updateSchema', (eventPayload: unknown) => {
        const p = eventPayload as Record<string, unknown>;
        const fields = p?.payload || eventPayload;
        if (Array.isArray(fields) && fields.length > 0) {
          platformFieldStore.setFields(fields);
        }
      });
    }
  }
}
