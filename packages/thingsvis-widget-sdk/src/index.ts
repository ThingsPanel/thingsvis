/**
 * @thingsvis/widget-sdk
 * 
 * SDK for developing ThingsVis widgets with Builder Pattern and Zod integration.
 * 
 * 设计理念：
 * - 傻瓜式：defineWidget 一站式定义，零配置开箱即用
 * - 专家级：Builder Pattern 精细控制
 * - 类型安全：Zod 驱动，TypeScript 自动推导
 */

// ============================================================================
// 类型导出
// ============================================================================
export * from './types';

// ============================================================================
// 核心 API
// ============================================================================
export { defineWidget, type DefineWidgetConfig } from './define-widget';
export { createControlPanel, ControlPanelBuilder } from './control-panel-builder';
export { generateControls, type GenerateControlsConfig } from './generate-controls';

// ============================================================================
// Schema 辅助
// ============================================================================
export { BasePropsSchema, type BaseProps } from './schemas/base-props';
export { withMixins, TransformMixin, ShadowMixin, BorderMixin } from './schemas/mixins';

// ============================================================================
// 工具函数
// ============================================================================
export { zodTypeToKind, getZodDefault, getZodDescription } from './utils/zod-helpers';
export { resolveWidgetColors, type WidgetColors } from './utils/themeContext';
