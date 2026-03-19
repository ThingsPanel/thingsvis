/**
 * Widget SDK type definitions.
 *
 * Canonical control/contract types are re-exported from @thingsvis/schema
 * (the single source of truth). This file adds SDK-specific authoring
 * helpers such as generic WidgetMainModule<TProps> and extended
 * WidgetOverlayContext.
 */

import type {
  WidgetCategory,
  WidgetMainModule as CanonicalWidgetMainModule,
  WidgetOverlayContext as SchemaOverlayContext,
  PluginOverlayInstance as SchemaPluginOverlayInstance,
} from '@thingsvis/schema';

import type { z } from 'zod';

// ============================================================================
// Re-export canonical types from @thingsvis/schema (single source of truth)
// ============================================================================

export type { WidgetCategory };

export type {
  I18nLabel,
  BindingMode,
  ControlBinding,
  ControlKind,
  ControlOption,
  ControlField,
  ControlGroup,
  ControlGroupId,
  WidgetControls,
} from '@thingsvis/schema';

// ============================================================================
// SDK-specific standard group IDs (DX convenience)
// ============================================================================

/** Recommended group IDs for widget controls. */
export type StandardGroupId = 'Content' | 'Style' | 'Data' | 'Advanced';

// ============================================================================
// Overlay types — extend canonical schema definitions
// ============================================================================

/** 主题预设标识 */
export type WidgetTheme = 'dawn' | 'midnight' | string;

/**
 * DOM Overlay 上下文（SDK 扩展版）
 *
 * Extends the canonical WidgetOverlayContext from @thingsvis/schema
 * with SDK-specific runtime fields (id, type, linkedNodes).
 */
export type WidgetOverlayContext = SchemaOverlayContext & {
  /** 组件实例 id */
  id?: string;
  /** 组件类型标识 */
  type?: string;
  /** 当前画布的主题上下文 (Dawn/Midnight) */
  theme?: WidgetTheme;
  /** 关联节点信息 */
  linkedNodes?: Record<
    string,
    {
      id: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
    }
  >;
};

/**
 * DOM Overlay 实例
 *
 * Re-exported from canonical @thingsvis/schema definition.
 * update() callback receives the SDK-extended WidgetOverlayContext.
 */
export type PluginOverlayInstance = {
  /** DOM 根元素 */
  element: HTMLElement;
  /** 属性更新回调 */
  update?: (ctx: WidgetOverlayContext) => void;
  /** 销毁回调 */
  destroy?: () => void;
};

// ============================================================================
// Widget main module — generic authoring version
// ============================================================================

/** 组件尺寸约束 */
export type WidgetConstraints = {
  /** 最小宽度（px） */
  minWidth?: number;
  /** 最小高度（px） */
  minHeight?: number;
  /** 最大宽度（px） */
  maxWidth?: number;
  /** 最大高度（px） */
  maxHeight?: number;
  /** 锁定宽高比（width/height） */
  aspectRatio?: number;
};

/**
 * SDK authoring version of WidgetMainModule.
 *
 * Extends the canonical `WidgetMainModule` from `@thingsvis/schema` with:
 * - Generic `<TProps>` parameter for Zod schema type inference
 * - SDK-extended `WidgetOverlayContext` (with id, type, linkedNodes)
 *
 * At runtime this type is structurally compatible with the schema version
 * when `TProps = Record<string, unknown>`.
 */
export type WidgetMainModule<TProps = Record<string, unknown>> = {
  /** 组件唯一标识 */
  id: string;
  /** 组件显示名称 */
  name?: string;
  /** 组件分类 */
  category?: WidgetCategory;
  /** 图标名称（Lucide 图标） */
  icon?: string;
  /** 版本号 */
  version?: string;
  locales?: Record<string, unknown>;
  /** Standalone-only demo props merged over schema defaults on initial creation. */
  standaloneDefaults?: Record<string, unknown>;
  /** Zod Schema (generic for authoring-time type inference) */
  schema?: z.ZodType<TProps>;
  /** 控件配置 */
  controls?: import('@thingsvis/schema').WidgetControls;
  /** 组件默认尺寸 */
  defaultSize?: { width: number; height: number };
  /** 组件尺寸约束 */
  constraints?: WidgetConstraints;
  /** 是否支持调整大小（默认 true） */
  resizable?: boolean;
  create?: (ctx?: WidgetOverlayContext) => unknown;
  /** 
   * 属性迁移函数
   * 
   * 当保存的 widgetVersion 与当前 widget.version 不匹配时，宿主调用此函数将旧格式 props 迁移为新格式
   * @param props - 保存的旧属性对象
   * @param fromVersion - 保存时的 widget 版本
   * @returns 迁移后的新属性对象
   */
  migrate?: (props: unknown, fromVersion: string) => unknown;
  /** 
   * 创建 DOM Overlay
   */
  createOverlay?: (ctx: WidgetOverlayContext) => PluginOverlayInstance;
  /**
   * 数据预处理钩子。宿主在调用 update() 前将主数据源原始数据传入，
   * 返回值将放入 WidgetOverlayContext.data 供组件使用。
   *
   * @param rawData  主数据源的原始输出
   * @param props    当前组件属性
   * @returns        处理后的数据
   */
  transformData?: (rawData: unknown, props: Record<string, unknown>) => unknown;
};
