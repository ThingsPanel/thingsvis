/**
 * 插件内部类型定义
 * 
 * ⚠️ 此文件由模板生成，开发者无需修改
 * 
 * 说明：
 * - 插件必须保持独立性，禁止从 @thingsvis/* 导入
 * - 这些类型与宿主期望的结构一致，但完全自包含
 */

import type { z } from 'zod';

// ============================================================================
// 控件类型定义
// ============================================================================

/** 绑定模式：静态值 | 字段选择 | 表达式 | 规则 */
export type BindingMode = 'static' | 'field' | 'expr' | 'rule';

/** 控件类型 */
export type ControlKind = 'string' | 'number' | 'boolean' | 'color' | 'select' | 'json' | 'nodeSelect';

/** 下拉选项 */
export type ControlOption = {
  label: string;
  value: string | number;
};

/** 绑定配置 */
export type ControlBinding = {
  enabled: boolean;
  modes: BindingMode[];
};

/** 控件字段定义 */
export type ControlField = {
  path: string;
  label: string;
  kind: ControlKind;
  options?: ControlOption[];
  default?: unknown;
  binding?: ControlBinding;
};

/** 控件分组 */
export type ControlGroup = {
  id: 'Content' | 'Style' | 'Data' | 'Advanced';
  label?: string;
  fields: ControlField[];
};

/** 控件配置 */
export type PluginControls = {
  groups: ControlGroup[];
};

// ============================================================================
// 插件模块类型
// ============================================================================

/** 连接节点的位置信息 */
export interface LinkedNodeInfo {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

/** 节点状态（宿主会额外注入 position/size；这里保持宽松以兼容） */
export interface PluginOverlayContext {
  id?: string;
  type?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  props?: Record<string, unknown>;
  /** 宿主注入的连接节点位置信息 */
  linkedNodes?: Record<string, LinkedNodeInfo>;
}

/** Overlay 实例接口 */
export interface PluginOverlayInstance {
  element: HTMLElement;
  update?: (ctx: PluginOverlayContext) => void;
  destroy?: () => void;
}

/** 插件主模块接口 */
export interface PluginMainModule {
  id: string;
  name: string;
  category: string;
  icon: string;
  version: string;
  resizable?: boolean;
  create: (node?: PluginOverlayContext) => unknown;
  createOverlay?: (ctx: PluginOverlayContext) => PluginOverlayInstance;
  schema?: z.ZodObject<any>;
  controls?: PluginControls;
}

// ============================================================================
// 控件生成工具
// ============================================================================

type ZodObjectShape = Record<string, z.ZodTypeAny>;

type GenerateControlsOptions<T extends ZodObjectShape> = {
  groups?: Partial<Record<'Content' | 'Style' | 'Data' | 'Advanced', (keyof T)[]>>;
  // NOTE: use string-key maps to avoid strict indexing issues under noUncheckedIndexedAccess.
  overrides?: Record<string, Partial<ControlField>>;
  bindings?: Record<string, ControlBinding>;
  /** 排除的字段，不会出现在任何分组中 */
  exclude?: (keyof T)[];
};

function inferKind(zodType: z.ZodTypeAny): ControlKind {
  const typeName = zodType._def.typeName;
  if (typeName === 'ZodNumber') return 'number';
  if (typeName === 'ZodBoolean') return 'boolean';
  if (typeName === 'ZodEnum') return 'select';
  return 'string';
}

function getDefault(zodType: z.ZodTypeAny): unknown {
  if (zodType._def.typeName === 'ZodDefault') {
    return zodType._def.defaultValue();
  }
  return undefined;
}

function getEnumOptions(zodType: z.ZodTypeAny): ControlOption[] | undefined {
  if (zodType._def.typeName === 'ZodEnum') {
    return zodType._def.values.map((v: string) => ({ label: v, value: v }));
  }
  return undefined;
}

function unwrap(zodType: z.ZodTypeAny): z.ZodTypeAny {
  let t = zodType;
  while (t._def.typeName === 'ZodDefault' || t._def.typeName === 'ZodOptional') {
    t = t._def.innerType;
  }
  return t;
}

export function generateControls<T extends ZodObjectShape>(
  schema: z.ZodObject<T>,
  options: GenerateControlsOptions<T> = {}
): PluginControls {
  const shape = schema.shape as T;
  const { groups = {}, overrides = {}, bindings = {}, exclude = [] } = options;

  const assignedKeys = new Set<string>();
  // 排除的字段也加入 assignedKeys，这样它们不会出现在 Advanced 中
  for (const k of exclude) {
    assignedKeys.add(k as string);
  }
  const result: ControlGroup[] = [];

  const groupOrder: ('Content' | 'Style' | 'Data' | 'Advanced')[] = ['Content', 'Style', 'Data', 'Advanced'];

  for (const groupId of groupOrder) {
    const keys = groups[groupId];
    if (!keys || keys.length === 0) continue;

    const fields: ControlField[] = [];
    for (const key of keys) {
      const k = key as string;
      assignedKeys.add(k);
      const zodType = (shape as any)[k] as z.ZodTypeAny | undefined;
      if (!zodType) continue;

      const inner = unwrap(zodType);
      const field: ControlField = {
        path: k,
        label: zodType.description ?? k,
        kind: inferKind(inner),
        default: getDefault(zodType),
        options: getEnumOptions(inner),
        ...(overrides[k] ?? {}),
      };
      if (bindings[k]) {
        field.binding = bindings[k];
      }
      fields.push(field);
    }
    if (fields.length > 0) {
      result.push({
        id: groupId,
        label:
          groupId === 'Content'
            ? '内容'
            : groupId === 'Style'
              ? '样式'
              : groupId === 'Data'
                ? '数据'
                : '高级',
        fields,
      });
    }
  }

  // Remaining keys go to 'Advanced'
  const remaining: ControlField[] = [];
  for (const k of Object.keys(shape)) {
    if (assignedKeys.has(k)) continue;
    const zodType = (shape as any)[k] as z.ZodTypeAny | undefined;
    if (!zodType) continue;
    const inner = unwrap(zodType);
    remaining.push({
      path: k,
      label: zodType.description ?? k,
      kind: inferKind(inner),
      default: getDefault(zodType),
      options: getEnumOptions(inner),
    });
  }
  if (remaining.length > 0) {
    result.push({ id: 'Advanced', label: '高级', fields: remaining });
  }

  return { groups: result };
}
