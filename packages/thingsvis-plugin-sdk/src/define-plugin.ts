/**
 * definePlugin - 一站式插件定义
 * 
 * 借鉴 Grafana 的设计理念，提供简洁的 API
 */

import type { z } from 'zod';
import type {
  PluginControls,
  PluginCategory,
  PluginOverlayContext,
  PluginOverlayInstance,
  ControlBinding,
  ControlKind,
  ControlGroupId,
  ControlField,
} from './types';
import { generateControls } from './generate-controls';

// ============================================================================
// 配置类型
// ============================================================================

/** 简化的控件配置 */
export type SimpleControlConfig = {
  kind?: ControlKind;
  label?: string;
  binding?: boolean | ControlBinding;
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string | number }>;
};

/** 简化的分组配置 */
export type SimpleGroupConfig = {
  [groupId in ControlGroupId]?: Array<string | { [field: string]: SimpleControlConfig }>;
};

/** definePlugin 配置 */
export type DefinePluginConfig<TProps extends z.ZodRawShape> = {
  /** 组件唯一标识 */
  id: string;
  /** 组件显示名称 */
  name: string;
  /** 组件分类 */
  category?: PluginCategory;
  /** 图标名称（Lucide 图标） */
  icon?: string;
  /** 版本号 */
  version?: string;
  /** Zod Schema 定义属性 */
  schema: z.ZodObject<TProps>;
  /** 
   * 控件配置
   * 
   * 支持两种模式：
   * 1. 简化模式：{ Content: ['title'], Style: ['color'] }
   * 2. 详细模式：{ Content: [{ title: { binding: true } }] }
   */
  controls?: SimpleGroupConfig | PluginControls;
  /** 
   * 一键开启所有绑定（傻瓜模式）
   * 设为 true 则所有字段自动支持数据绑定
   */
  enableAllBindings?: boolean;
  /** 
   * 渲染函数
   * 
   * @param el - DOM 容器元素
   * @param props - 组件属性
   * @returns 生命周期方法
   */
  render: (
    el: HTMLElement,
    props: z.infer<z.ZodObject<TProps>>
  ) => {
    update?: (props: z.infer<z.ZodObject<TProps>>) => void;
    destroy?: () => void;
  };
};

// ============================================================================
// 内部辅助函数
// ============================================================================

function isPluginControls(obj: unknown): obj is PluginControls {
  return typeof obj === 'object' && obj !== null && 'groups' in obj && Array.isArray((obj as PluginControls).groups);
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
// definePlugin 主函数
// ============================================================================

/**
 * 定义 ThingsVis 插件
 * 
 * @example
 * ```typescript
 * import { definePlugin } from '@thingsvis/plugin-sdk';
 * import { z } from 'zod';
 * 
 * export default definePlugin({
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
export function definePlugin<TProps extends z.ZodRawShape>(
  config: DefinePluginConfig<TProps>
) {
  const {
    id,
    name,
    category = 'custom',
    icon,
    version = '1.0.0',
    schema,
    controls: controlsConfig,
    enableAllBindings = false,
    render,
  } = config;

  // 处理 controls 配置
  let controls: PluginControls;

  if (!controlsConfig) {
    // 无配置：自动从 schema 生成，所有字段放 Advanced
    controls = generateControls(schema, {
      bindings: enableAllBindings ? Object.fromEntries(
        Object.keys(schema.shape).map(key => [key, { enabled: true, modes: ['static', 'field', 'expr'] }])
      ) : undefined,
    });
  } else if (isPluginControls(controlsConfig)) {
    // 已是完整格式
    controls = controlsConfig;
  } else {
    // 简化格式，需要转换
    const { groups, overrides, bindings } = normalizeSimpleGroupConfig(controlsConfig, enableAllBindings);
    controls = generateControls(schema, { groups, overrides, bindings });
  }

  // 创建 createOverlay 函数
  const createOverlay = (ctx: PluginOverlayContext): PluginOverlayInstance => {
    const element = document.createElement('div');
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.pointerEvents = 'auto';

    // 解析默认值
    const defaultProps = schema.parse({});
    let currentProps = { ...defaultProps, ...(ctx.props as Partial<z.infer<z.ZodObject<TProps>>>) };

    // 调用渲染函数
    const lifecycle = render(element, currentProps);

    return {
      element,
      update: (newCtx: PluginOverlayContext) => {
        currentProps = { ...defaultProps, ...(newCtx.props as Partial<z.infer<z.ZodObject<TProps>>>) };
        lifecycle.update?.(currentProps);
      },
      destroy: () => {
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
    schema,
    controls,
    createOverlay,
  };
}
