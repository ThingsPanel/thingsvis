/**
 * Embed Mode Initializer
 * 
 * 处理嵌入模式下的初始化逻辑，包括:
 * - 解析宿主传来的配置
 * - 设置正确的项目 ID
 * - 初始化 SaveStrategy
 * - 配置 API Client 使用宿主提供的 Token
 */

import { updateEmbeddedConfig, initSaveStrategy, type SaveTarget } from '../lib/storage/saveStrategy';
import { apiClient } from '../lib/api/client';

// 存储嵌入模式的 token（由宿主通过 URL 传递）
let embedToken: string | null = null;

/**
 * 配置 API Client 使用嵌入模式的 token 和 baseUrl
 */
export function configureEmbedApiClient(token: string, baseUrl?: string): void {
  embedToken = token;
  // 注意：不使用宿主传递的 baseUrl，因为会有 CORS 问题
  // ThingsVis iframe 应该继续调用自己的服务器

  // 只配置 token，不改变 baseUrl
  // 因为 ThingsVis iframe 需要调用自己的服务器 (localhost:3001)
  // 而不是宿主的代理 (localhost:5002/thingsvis-api)
  apiClient.configure({
    // baseUrl 保持默认，不覆盖
    getToken: () => embedToken,
  });
}

/**
 * 获取当前嵌入模式的 token
 */
export function getEmbedToken(): string | null {
  return embedToken;
}

export interface EmbedInitPayload {
  data?: {
    meta?: {
      id?: string;
      name?: string;
      version?: string;
      thumbnail?: string; // Add thumbnail type
    };
    canvas?: {
      mode?: string;
      width?: number;
      height?: number;
      background?: string;
      gridCols?: number;
      gridRowHeight?: number;
      gridGap?: number;
      fullWidthPreview?: boolean;
      theme?: string;
      gridSettings?: {
        cols?: number;
        rowHeight?: number;
        gap?: number;
        compactVertical?: boolean;
        responsive?: boolean;
      };
    };
    nodes?: any[];
    dataSources?: any[];
  };
  config?: {
    saveTarget?: SaveTarget;
    mode?: string;
    apiConfig?: {
      baseURL?: string;
    };
  };
}

export interface ProcessedEmbedData {
  /** 项目 ID (优先使用宿主传来的 ID) */
  projectId: string;
  /** 项目名称 */
  projectName: string;
  /** 画布配置 */
  canvas: {
    mode: string;
    width: number;
    height: number;
    background: string;
    gridCols: number;
    gridRowHeight: number;
    gridGap: number;
    fullWidthPreview: boolean;
  };
  /** 节点数据 */
  nodes: any[];
  /** 数据源 */
  dataSources: any[];
  /** 保存目标 */
  saveTarget: SaveTarget;
  /** 缩略图 */
  thumbnail?: string;
}

/**
 * 处理宿主传来的初始化数据
 */
export function processEmbedInitPayload(payload: EmbedInitPayload): ProcessedEmbedData | null {
  if (!payload?.data) {
    console.warn('[EmbedInit] 无效的 payload，缺少 data');
    return null;
  }

  const data = payload.data;
  const config = payload.config || {};

  // 🔑 关键：使用宿主传来的 meta.id 作为项目 ID
  const projectId = data.meta?.id || `embed-${Date.now()}`;
  const projectName = data.meta?.name || 'Embedded Project';
  const thumbnail = data.meta?.thumbnail; // Extract thumbnail
  const saveTarget: SaveTarget = config.saveTarget || 'self';



  // 更新 SaveStrategy 配置
  updateEmbeddedConfig({
    projectId,
    projectName,
    saveTarget,
  });

  // 处理画布配置
  const canvas = {
    mode: data.canvas?.mode || 'grid',
    width: data.canvas?.width || 1920,
    height: data.canvas?.height || 1080,
    background: data.canvas?.background || '#1a1a1a',
    gridCols: data.canvas?.gridCols ?? 24,
    gridRowHeight: data.canvas?.gridRowHeight ?? 50,
    gridGap: data.canvas?.gridGap ?? 5,
    fullWidthPreview: data.canvas?.fullWidthPreview ?? false,
  };

  // 处理节点数据
  const nodes = (data.nodes || []).map((node: any, index: number) => ({
    id: node.id || `node-${Date.now()}-${index}`,
    type: node.type,
    position: node.position || { x: 100, y: 100 },
    size: node.size || { width: 200, height: 80 },
    props: node.props || {},
    thingModelBindings: node.thingModelBindings || [],
    grid: node.grid,
  }));

  return {
    projectId,
    projectName,
    canvas,
    nodes,
    dataSources: data.dataSources || [],
    saveTarget,
    thumbnail, // Pass thumbnail
  };
}

/**
 * 从 URL 参数解析嵌入配置并初始化 SaveStrategy
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
      // 配置 API Client 使用宿主的 token
      if (token) {
        configureEmbedApiClient(token);

      } else {
        console.warn('[EmbedInit] ⚠️ 未找到 token，将使用默认认证');
      }

      initSaveStrategy({
        isAuthenticated: isAuthenticated || !!token, // 有 token 视为已认证
        embeddedProjectId: undefined, // 稍后由 init 消息设置
      });

      if (saveTarget === 'host' || saveTarget === 'self') {
        updateEmbeddedConfig({ saveTarget });
      }
    }
  } else {

  }


}
