/**
 * defineWidget - 一站式插件定义
 * 
 * 借鉴 Grafana 的设计理念，提供简洁的 API
 */

import type { z } from 'zod';
import type {
  WidgetControls,
  WidgetCategory,
  WidgetOverlayContext,
  PluginOverlayInstance,
  ControlBinding,
  ControlKind,
  ControlGroupId,
  ControlField,
  ControlText,
  I18nLabel,
} from './types';
import { generateControls } from './generate-controls';

// ============================================================================
// 配置类型
// ============================================================================

/** 简化的控件配置 */
export type SimpleControlConfig = {
  kind?: ControlKind;
  label?: I18nLabel;
  binding?: boolean | ControlBinding;
  placeholder?: ControlText;
  description?: ControlText;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: I18nLabel; value: string | number }>;
};

/** 简化的分组配置 */
export type SimpleGroupConfig = {
  [groupId in ControlGroupId]?: Array<string | { [field: string]: SimpleControlConfig }>;
};

/** defineWidget 配置 */
export type DefineWidgetConfig<TProps extends z.ZodRawShape> = {
  /** 组件唯一标识 */
  id: string;
  /** 组件显示名称 */
  name: string;
  /** 组件分类 */
  category?: WidgetCategory;
  /** 图标名称（Lucide 图标） */
  icon?: string;
  /** 版本号 */
  version?: string;
  /** Whether the widget supports resizing (default: true) */
  resizable?: boolean;
  /** Default size when the widget is first created */
  defaultSize?: { width: number; height: number };
  /** Size constraints enforced during drag/resize */
  constraints?: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: number;
  };
  /** Zod Schema 定义属性 */
  schema: z.ZodObject<TProps>;
  /** Standalone-only demo props merged over schema defaults on initial creation. */
  standaloneDefaults?: Record<string, unknown>;
  /** 多语言翻译配置 (可选) */
  locales?: Record<string, Record<string, unknown>>;
  /** 
   * 控件配置
   * 
   * 支持两种模式：
   * 1. 简化模式：{ Content: ['title'], Style: ['color'] }
   * 2. 详细模式：{ Content: [{ title: { binding: true } }] }
   */
  controls?: SimpleGroupConfig | WidgetControls;
  /** 
   * 一键开启所有绑定（傻瓜模式）
   * 设为 true 则所有字段自动支持数据绑定
   */
  enableAllBindings?: boolean;
  /**
   * 属性迁移函数
   * 
   * 当保存的 widgetVersion 与当前 widget.version 不匹配时，宿主调用此函数
   * @param props - 保存的旧属性对象
   * @param fromVersion - 保存时的 widget 版本
   * @returns 迁移后的新属性对象
   */
  migrate?: (props: unknown, fromVersion: string) => unknown;
  /**
   * 数据预处理钩子。宿主在调用 update() 前将主数据源原始数据传入，
   * 返回值将放入 WidgetOverlayContext.data 供组件使用。
   */
  transformData?: (rawData: unknown, props: Record<string, unknown>) => unknown;
  /** 
   * 渲染函数
   * 
   * @param el - DOM 容器元素
   * @param props - 组件属性
   * @param ctx - 组件上下文（位置、尺寸、主题等）
   * @returns 生命周期方法
   */
  render: (
    el: HTMLElement,
    props: z.infer<z.ZodObject<TProps>>,
    ctx: WidgetOverlayContext
  ) => {
    update?: (props: z.infer<z.ZodObject<TProps>>, ctx: WidgetOverlayContext) => void;
    destroy?: () => void;
  };
};

// ============================================================================
// 内部辅助函数
// ============================================================================

function isWidgetControls(obj: unknown): obj is WidgetControls {
  return typeof obj === 'object' && obj !== null && 'groups' in obj && Array.isArray((obj as WidgetControls).groups);
}

function normalizeSimpleGroupConfig(
  simpleConfig: SimpleGroupConfig,
  enableAllBindings: boolean
): { groups: Record<string, string[]>; overrides: Record<string, Partial<ControlField>>; bindings: Record<string, ControlBinding> } {
  const groups: Record<string, string[]> = {};
  const overrides: Record<string, Partial<ControlField>> = {};
  const bindings: Record<string, ControlBinding> = {};

  const defaultBinding: ControlBinding = { enabled: true, modes: ['static', 'field', 'expr'] };

  for (const [groupId, fields] of Object.entries(simpleConfig)) {
    if (!fields) continue;
    const fieldNames: string[] = [];

    for (const field of fields) {
      if (typeof field === 'string') {
        fieldNames.push(field);
        if (enableAllBindings) {
          bindings[field] = defaultBinding;
        }
      } else {
        // { fieldName: { kind: 'color', binding: true } }
        for (const [fieldName, config] of Object.entries(field)) {
          fieldNames.push(fieldName);

          // 提取非 binding 的属性作为 override
          const { binding, ...rest } = config;
          if (rest.kind || rest.label || rest.placeholder || rest.description || rest.options) {
            overrides[fieldName] = rest;
          }

          if (binding === true || enableAllBindings) {
            bindings[fieldName] = defaultBinding;
          } else if (typeof binding === 'object') {
            bindings[fieldName] = binding;
          }
        }
      }
    }

    groups[groupId] = fieldNames;
  }

  return { groups, overrides, bindings };
}

// ============================================================================
// defineWidget 主函数
// ============================================================================

/**
 * 定义 ThingsVis 插件
 * 
 * @example
 * ```typescript
 * import { defineWidget } from '@thingsvis/widget-sdk';
 * import { z } from 'zod';
 * 
 * export default defineWidget({
 *   id: 'my-chart',
 *   name: '我的图表',
 *   category: 'chart',
 *   
 *   schema: z.object({
 *     title: z.string().default('标题'),
 *     color: z.string().default('#1890ff'),
 *   }),
 *   
 *   controls: {
 *     Content: ['title'],
 *     Style: [{ color: { kind: 'color', binding: true } }],
 *   },
 *   
 *   render: (el, props) => {
 *     el.innerHTML = `<h1 style="color: ${props.color}">${props.title}</h1>`;
 *     return {
 *       update: (newProps) => {
 *         el.innerHTML = `<h1 style="color: ${newProps.color}">${newProps.title}</h1>`;
 *       },
 *       destroy: () => {
 *         el.innerHTML = '';
 *       },
 *     };
 *   },
 * });
 * ```
 */
export function defineWidget<TProps extends z.ZodRawShape>(
  config: DefineWidgetConfig<TProps>
) {
  const {
    id,
    name,
    category = 'custom',
    icon,
    version = '1.0.0',
    schema,
    standaloneDefaults,
    controls: controlsConfig,
    locales,
    enableAllBindings = false,
    render,
    migrate,
    transformData,
    defaultSize,
    constraints,
    resizable,
  } = config;

  // 处理 controls 配置
  let controls: WidgetControls;

  if (!controlsConfig) {
    // 无配置：自动从 schema 生成，所有字段放 Advanced
    controls = generateControls(schema, {
      bindings: enableAllBindings ? Object.fromEntries(
        Object.keys(schema.shape).map(key => [key, { enabled: true, modes: ['static', 'field', 'expr'] }])
      ) : undefined,
    });
  } else if (isWidgetControls(controlsConfig)) {
    // 已是完整格式
    controls = controlsConfig;
  } else {
    // 简化格式，需要转换
    const { groups, overrides, bindings } = normalizeSimpleGroupConfig(controlsConfig, enableAllBindings);
    controls = generateControls(schema, { groups, overrides, bindings });
  }

  const defaultProps = schema.parse({});

  // 创建 createOverlay 函数
  const createOverlay = (ctx: WidgetOverlayContext): PluginOverlayInstance => {
    const element = document.createElement('div');
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.pointerEvents = 'auto';

    let currentProps = { ...defaultProps, ...(ctx.props as Partial<z.infer<z.ZodObject<TProps>>>) };
    let currentCtx = ctx;

    const handleWidgetEmit = (event: Event) => {
      const customEvent = event as CustomEvent<{ event?: string; data?: unknown }>;
      const eventName = customEvent.detail?.event;
      if (!eventName) return;
      currentCtx.emit?.(eventName, customEvent.detail?.data);
    };

    element.addEventListener('widget:emit', handleWidgetEmit as EventListener);

    // 调用渲染函数
    const lifecycle = render(element, currentProps, ctx);

    return {
      element,
      update: (newCtx: WidgetOverlayContext) => {
        currentCtx = newCtx;
        currentProps = { ...defaultProps, ...(newCtx.props as Partial<z.infer<z.ZodObject<TProps>>>) };
        lifecycle.update?.(currentProps, newCtx);
      },
      destroy: () => {
        element.removeEventListener('widget:emit', handleWidgetEmit as EventListener);
        lifecycle.destroy?.();
      },
    };
  };

  return {
    id,
    name,
    category,
    icon,
    version,
    standaloneDefaults,
    schema,
    controls,
    locales,
    migrate,
    transformData,
    defaultSize,
    constraints,
    resizable,
    defaultProps,
    createOverlay,
  };
}
