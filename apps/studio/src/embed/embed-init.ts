/**
 * Embed Mode Initializer
 * 
 * 处理嵌入模式下的初始化逻辑，包括:
 * - 解析宿主传来的配置
 * - 设置正确的项目 ID
 * - 初始化 SaveStrategy
 */

import { updateEmbeddedConfig, initSaveStrategy, type SaveTarget } from '../lib/storage/saveStrategy';

export interface EmbedInitPayload {
  data?: {
    meta?: {
      id?: string;
      name?: string;
      version?: string;
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
  const saveTarget: SaveTarget = config.saveTarget || 'self';

  console.log('[EmbedInit] 处理嵌入初始化数据:', {
    projectId,
    projectName,
    saveTarget,
    nodesCount: data.nodes?.length || 0,
  });

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
    
    if (mode === 'embedded') {
      initSaveStrategy({
        isAuthenticated,
        embeddedProjectId: undefined, // 稍后由 init 消息设置
      });
      
      if (saveTarget === 'host' || saveTarget === 'self') {
        updateEmbeddedConfig({ saveTarget });
      }
    }
  }
}
