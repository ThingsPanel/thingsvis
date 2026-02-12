/**
 * Save Strategy Manager
 * 
 * 统一管理不同场景下的保存策略:
 * 
 * 场景1: 独立部署运行 (standalone)
 *   - 已登录用户: 保存到 ThingsVis 云端 API
 *   - 未登录用户: 保存到本地 IndexedDB
 * 
 * 场景2: 嵌入物模型 (embedded + saveTarget=host)
 *   - 发送 thingsvis:host-save 消息给宿主
 *   - ThingsPanel 接收后保存到 web_chart_config 字段
 * 
 * 场景3: 嵌入可视化 (embedded + saveTarget=self)
 *   - 保存到 ThingsVis 云端 API
 *   - 使用宿主传来的 dashboard ID
 */

import { isEmbedMode, requestSave as sendToHost } from '../../embed/embed-mode';

// =============================================================================
// Types
// =============================================================================

export type SaveTarget = 'self' | 'host';
export type StorageBackend = 'local' | 'cloud';

export interface SaveStrategyConfig {
  /** 保存目标: self=ThingsVis后端, host=宿主平台 */
  saveTarget: SaveTarget;
  /** 存储后端: local=IndexedDB, cloud=ThingsVis API */
  storageBackend: StorageBackend;
  /** 是否嵌入模式 */
  isEmbedded: boolean;
  /** 宿主传来的项目ID (嵌入模式) */
  embeddedProjectId?: string;
  /** 宿主传来的项目名称 */
  embeddedProjectName?: string;
}

export interface SavePayload {
  meta?: {
    id?: string;
    name?: string;
    version?: string;
  };
  canvas: {
    mode: string;
    width: number;
    height: number;
    background?: string;
    gridCols?: number;
    gridRowHeight?: number;
    gridGap?: number;
    fullWidthPreview?: boolean;
  };
  nodes: any[];
  dataSources?: any[];
  dataBindings?: any[];
}

// =============================================================================
// State
// =============================================================================

let currentConfig: SaveStrategyConfig = {
  saveTarget: 'self',
  storageBackend: 'local',
  isEmbedded: false,
};

// 快照缓存 - 避免每次调用 getSaveStrategy 都创建新对象
let cachedSnapshot: SaveStrategyConfig = { ...currentConfig };
let snapshotVersion = 0;

const listeners = new Set<() => void>();

// =============================================================================
// URL Parameter Parsing
// =============================================================================

/**
 * 从URL参数解析保存配置
 */
function parseUrlParams(): Partial<SaveStrategyConfig> {
  const config: Partial<SaveStrategyConfig> = {};

  try {
    // 尝试从 hash 参数解析
    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');
    if (queryIndex >= 0) {
      const params = new URLSearchParams(hash.slice(queryIndex + 1));

      const saveTarget = params.get('saveTarget');
      if (saveTarget === 'host' || saveTarget === 'self') {
        config.saveTarget = saveTarget;
      }

      const mode = params.get('mode');
      if (mode === 'embedded') {
        config.isEmbedded = true;
      }
    }

    // 也检查普通 query 参数
    const urlParams = new URLSearchParams(window.location.search);
    const saveTarget = urlParams.get('saveTarget');
    if (saveTarget === 'host' || saveTarget === 'self') {
      config.saveTarget = saveTarget;
    }
  } catch (e) {
    console.warn('[SaveStrategy] Failed to parse URL params:', e);
  }

  return config;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * 初始化保存策略
 * 在应用启动时调用
 */
export function initSaveStrategy(options?: {
  isAuthenticated?: boolean;
  embeddedProjectId?: string;
  embeddedProjectName?: string;
}): void {
  const urlConfig = parseUrlParams();
  const isEmbedded = isEmbedMode() || urlConfig.isEmbedded || false;

  // 确定存储后端
  let storageBackend: StorageBackend = 'local';
  if (options?.isAuthenticated) {
    storageBackend = 'cloud';
  }
  // 嵌入模式且 saveTarget=self 时，强制使用云端存储
  if (isEmbedded && urlConfig.saveTarget !== 'host') {
    storageBackend = 'cloud';
  }

  currentConfig = {
    saveTarget: urlConfig.saveTarget || 'self',
    storageBackend,
    isEmbedded,
    embeddedProjectId: options?.embeddedProjectId,
    embeddedProjectName: options?.embeddedProjectName,
  };


  notifyListeners();
}

/**
 * 更新嵌入配置 (收到宿主 init 消息时调用)
 */
export function updateEmbeddedConfig(config: {
  projectId?: string;
  projectName?: string;
  saveTarget?: SaveTarget;
}): void {
  // 🔑 关键修复：调用此函数意味着我们在嵌入模式下
  currentConfig.isEmbedded = true;

  if (config.projectId) {
    currentConfig.embeddedProjectId = config.projectId;
  }
  if (config.projectName) {
    currentConfig.embeddedProjectName = config.projectName;
  }
  if (config.saveTarget) {
    currentConfig.saveTarget = config.saveTarget;
    // 如果 saveTarget=self，确保使用云端存储
    if (config.saveTarget === 'self') {
      currentConfig.storageBackend = 'cloud';
    }
  }


  notifyListeners();
}

/**
 * 获取当前保存策略配置
 * 返回缓存的快照对象，保持引用稳定性
 */
export function getSaveStrategy(): SaveStrategyConfig {
  return cachedSnapshot;
}

/**
 * 判断是否应该保存到宿主
 */
export function shouldSaveToHost(): boolean {
  return currentConfig.isEmbedded && currentConfig.saveTarget === 'host';
}

/**
 * 判断是否应该保存到云端
 */
export function shouldSaveToCloud(): boolean {
  return currentConfig.storageBackend === 'cloud' ||
    (currentConfig.isEmbedded && currentConfig.saveTarget === 'self');
}

/**
 * 获取当前项目ID (嵌入模式使用宿主传来的ID)
 */
export function getEffectiveProjectId(fallbackId: string): string {
  if (currentConfig.isEmbedded && currentConfig.embeddedProjectId) {
    return currentConfig.embeddedProjectId;
  }
  return fallbackId;
}

/**
 * 执行保存操作
 */
export async function executeSave(payload: SavePayload): Promise<{ success: boolean; error?: string }> {


  // 场景2: 嵌入物模型 - 保存到宿主
  if (shouldSaveToHost()) {
    return saveToHost(payload);
  }

  // 场景1 & 场景3: 保存到 ThingsVis (云端或本地)
  // 实际保存逻辑由 useAutoSave 处理，这里只返回成功
  // 因为 useAutoSave 已经配置好使用正确的存储适配器
  return { success: true };
}

/**
 * 保存到宿主平台 (通过 postMessage)
 */
function saveToHost(payload: SavePayload): { success: boolean; error?: string } {
  try {

    sendToHost(payload);
    return { success: true };
  } catch (error) {
    console.error('[SaveStrategy] Failed to save to host:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 订阅配置变更
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  // 更新快照版本和缓存
  snapshotVersion++;
  cachedSnapshot = { ...currentConfig };

  listeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      console.error('[SaveStrategy] Listener error:', e);
    }
  });
}

// =============================================================================
// React Hook
// =============================================================================

import { useSyncExternalStore, useCallback } from 'react';

export function useSaveStrategy(): SaveStrategyConfig {
  return useSyncExternalStore(
    useCallback((callback) => subscribe(callback), []),
    () => getSaveStrategy(),
    () => getSaveStrategy()
  );
}
