/**
 * 核心类型定义
 * 
 * 与 @thingsvis/schema 保持兼容，同时提供更丰富的类型
 */

import type { z } from 'zod';

/**
 * i18n label 类型：可以是字符串或多语言 map
 * 与 @thingsvis/schema 中的 I18nLabel 保持结构兼容
 */
export type I18nLabel = string | Record<string, string>;

// ============================================================================
// 绑定模式
// ============================================================================

/** 绑定模式：静态值 | 字段选择 | 表达式 | 规则 */
export type BindingMode = 'static' | 'field' | 'expr' | 'rule';

/** 绑定配置 */
export type ControlBinding = {
  enabled: boolean;
  modes: BindingMode[];
};

// ============================================================================
// 控件类型 - 扩展版
// ============================================================================

/** 
 * 控件类型枚举
 * 
 * 分类：
 * - 基础：string, number, boolean
 * - 颜色：color, gradient, colorScheme
 * - 选择：select, multiSelect, radio, segmented
 * - 复杂：json, code, expression
 * - 特殊：image, icon, font
 * - 数据：dataField, dataSource, nodeSelect
 * - 布局：slider, rangeSlider, margin, padding
 */
export type ControlKind =
  // 基础
  | 'string'
  | 'number'
  | 'boolean'
  | 'textarea'
  // 颜色
  | 'color'
  | 'gradient'
  | 'colorScheme'
  // 选择
  | 'select'
  | 'multiSelect'
  | 'radio'
  | 'segmented'
  // 复杂
  | 'json'
  | 'code'
  | 'expression'
  // 特殊
  | 'image'
  | 'icon'
  | 'font'
  // 数据
  | 'dataField'
  | 'dataSource'
  | 'nodeSelect'
  // 布局
  | 'slider'
  | 'rangeSlider'
  | 'margin'
  | 'padding';

/** 下拉选项 */
export type ControlOption = {
  label: I18nLabel;
  value: string | number;
  /** Lucide 图标名称（用于 segmented 等控件） */
  icon?: string;
};

// ============================================================================
// 控件字段定义
// ============================================================================

/** 控件字段完整定义 */
export type ControlField = {
  /** 属性路径（映射到 props 的 key） */
  path: string;
  /** 显示标签（支持字符串 i18n key 或 { en, zh, ... } 多语言 map） */
  label: I18nLabel;
  /** 控件类型 */
  kind: ControlKind;
  /** 下拉选项（select/multiSelect/radio/segmented 使用） */
  options?: ControlOption[];
  /** 默认值 */
  default?: unknown;
  /** 数据绑定配置 */
  binding?: ControlBinding;
  /** 占位提示文字 */
  placeholder?: string;
  /** 描述/帮助文字 */
  description?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 条件显示（依赖其他字段） */
  showWhen?: {
    field: string;
    value: unknown;
  };
  /** 数值范围（slider/number 使用） */
  min?: number;
  max?: number;
  step?: number;
};

// ============================================================================
// 控件分组
// ============================================================================

/** 标准分组 ID */
export type ControlGroupId = 'Content' | 'Style' | 'Data' | 'Advanced';

/** 控件分组 */
export type ControlGroup = {
  id: ControlGroupId | string;
  label?: I18nLabel;
  /** 是否默认展开 */
  expanded?: boolean;
  fields: ControlField[];
};

/** 插件控件配置（序列化格式） */
export type WidgetControls = {
  groups: ControlGroup[];
};

// ============================================================================
// Overlay 相关类型
// ============================================================================

/** 主题预设标识 */
export type WidgetTheme = 'dawn' | 'midnight' | string;

/** DOM Overlay 上下文 */
export type WidgetOverlayContext = {
  /** 位置（画布坐标） */
  position?: { x: number; y: number };
  /** 尺寸 */
  size?: { width: number; height: number };
  /** 组件属性（已解析） */
  props?: Record<string, unknown>;
  /** 当前画布的主题上下文 (Dawn/Midnight) */
  theme?: WidgetTheme;
};

/** DOM Overlay 实例 */
export type PluginOverlayInstance = {
  /** DOM 根元素 */
  element: HTMLElement;
  /** 属性更新回调 */
  update?: (ctx: WidgetOverlayContext) => void;
  /** 销毁回调 */
  destroy?: () => void;
};

// ============================================================================
// 插件主模块类型
// ============================================================================

/** 插件分类 */
export type WidgetCategory = 'basic' | 'chart' | 'media' | 'custom' | 'indicator' | string;

/**
 * 插件主模块接口
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
  /** Zod Schema */
  schema?: z.ZodType<TProps>;
  /** 控件配置 */
  controls?: WidgetControls;
  /** 
   * 创建 DOM Overlay
   */
  createOverlay: (ctx: WidgetOverlayContext) => PluginOverlayInstance;
};
