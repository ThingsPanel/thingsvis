/**
 * Plugin remote module shape for Module Federation.
 *
 * IMPORTANT:
 * - `packages/thingsvis-schema` must remain React-free. We therefore avoid React types here.
 * - Hosts can treat `Spec` as "unknown" and render it if it matches their runner expectations.
 */

import type { WidgetControls } from './widget-controls';

export type WidgetComponentId = string; // e.g. "basic/rect"

/**
 * 组件属性的元数据描述
 * - 注意：这里是“最低公分母”结构，避免 schema 包耦合到具体 UI 框架
 */
export type PluginPropSchema = {
  /**
   * 属性基础类型，用于生成表单/智能提示
   */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /**
   * 默认值
   * - Host 在创建节点时，可以通过它生成初始 props
   */
  default?: unknown;
  /**
   * 文档描述，供属性面板 / AI 提示使用
   */
  description?: string;
};

/**
 * 插件级别的 Schema 描述
 * - Phase 3 MVP：仅约定 props 结构，其他（事件、数据绑定等）后续扩展
 */
export type PluginSchema = {
  props?: Record<string, PluginPropSchema>;
};

/**
 * 提供给 DOM Overlay 的上下文（避免插件依赖 Kernel 类型）
 */
export type WidgetOverlayContext = {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  props?: Record<string, unknown>;
  theme?: string;
};

/**
 * 插件可选的 DOM Overlay 实例
 * - element：由插件创建的实际 DOM 根节点
 * - update/destroy：可选生命周期
 */
export type PluginOverlayInstance = {
  element: HTMLElement;
  update?: (ctx: WidgetOverlayContext) => void;
  destroy?: () => void;
};

export type WidgetMainModule = {
  id: string; // e.g. "basic-text"
  name?: string;
  category?: string;
  icon?: string;
  version?: string;
  /**
   * i18n resources defined by the widget.
   * e.g. { zh: { editor: { "widget.my-widget": { text: "..." } } } }
   */
  locales?: Record<string, any>;
  /**
   * Create a Leafer-compatible renderer instance (usually a Leafer UI node).
   * The host is responsible for mounting/updating/destroying it.
   * 
   * Note: Either `create` or `createOverlay` must be provided.
   * - Use `create` for Leafer-based components (basic, layout, etc.)
   * - Use `createOverlay` for DOM-based components (chart, media, 3D, etc.)
   */
  create?: () => unknown;
  /**
   * Zod Schema for props validation and UI generation.
   * Host treats it as any to avoid strict zod dependency in all consumers.
   */
  schema?: any;

  /**
   * Optional serializable Controls definition for Studio property panel generation.
   *
   * If missing or invalid, Studio should fall back to its legacy/manual panel.
   */
  controls?: WidgetControls;
  /**
   * 创建 DOM Overlay（用于 ECharts / HTML 容器等非 Leafer 渲染场景）
   * 
   * Note: Either `create` or `createOverlay` must be provided.
   */
  createOverlay?: (ctx: WidgetOverlayContext) => PluginOverlayInstance;
};


