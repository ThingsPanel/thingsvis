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
export type ControlKind = 'string' | 'number' | 'boolean' | 'color' | 'select' | 'json' | 'image';

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

/** 插件控件配置 */
export type WidgetControls = {
  groups: ControlGroup[];
};

// ============================================================================
// 插件主模块类型
// ============================================================================

/** DOM Overlay 上下文 */
export type WidgetOverlayContext = {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  props?: Record<string, unknown>;
};

/** DOM Overlay 实例 */
export type PluginOverlayInstance = {
  element: HTMLElement;
  update?: (ctx: WidgetOverlayContext) => void;
  destroy?: () => void;
};

/**
 * 插件主模块接口
 * 
 * 这是插件必须导出的 Main 对象的类型定义
 */
export type WidgetMainModule = {
  /** 组件唯一标识，如 "basic-text" */
  id: string;
  /** 组件显示名称 */
  name?: string;
  /** 组件分类：basic | layout | media | chart | custom | data | interaction */
  category?: string;
  /** 图标名称（Lucide 图标） */
  icon?: string;
  /** 版本号 */
  version?: string;
  /** 创建 Leafer UI 节点实例（可选，如果有 createOverlay 可以不提供） */
  create?: () => unknown;
  /** Zod Schema，用于属性验证和 UI 生成 */
  schema?: z.ZodType<unknown>;
  /** 控件配置，用于 Studio 动态生成属性面板 */
  controls?: WidgetControls;
  /** 创建 DOM Overlay（用于 ECharts/HTML 等非 Leafer 渲染） */
  createOverlay?: (ctx: WidgetOverlayContext) => PluginOverlayInstance;
};

// ============================================================================
// 工具函数：从 Zod Schema 生成 Controls
// ============================================================================

type ZodShape = Record<string, z.ZodTypeAny>;

/** Zod 类型到控件类型的映射 */
function zodTypeToKind(zodType: z.ZodTypeAny): ControlKind {
  const typeName = zodType._def?.typeName;
  
  switch (typeName) {
    case 'ZodNumber':
      return 'number';
    case 'ZodBoolean':
      return 'boolean';
    case 'ZodEnum':
      return 'select';
    case 'ZodObject':
    case 'ZodArray':
      return 'json';
    case 'ZodString':
    default:
      return 'string';
  }
}

/** 获取 Zod Schema 的默认值 */
function getZodDefault(zodType: z.ZodTypeAny): unknown {
  if (zodType._def?.typeName === 'ZodDefault') {
    return zodType._def.defaultValue();
  }
  // 递归处理 ZodOptional 等包装类型
  if (zodType._def?.innerType) {
    return getZodDefault(zodType._def.innerType);
  }
  return undefined;
}

/** 获取 Zod Schema 的描述 */
function getZodDescription(zodType: z.ZodTypeAny): string | undefined {
  return zodType._def?.description ?? zodType.description;
}

/** 获取 ZodEnum 的选项 */
function getEnumOptions(zodType: z.ZodTypeAny): ControlOption[] | undefined {
  // 处理 ZodDefault 包装
  let innerType = zodType;
  if (zodType._def?.typeName === 'ZodDefault') {
    innerType = zodType._def.innerType;
  }
  
  if (innerType._def?.typeName === 'ZodEnum') {
    const values = innerType._def.values as string[];
    return values.map((v) => ({ label: v, value: v }));
  }
  return undefined;
}

/** Controls 生成配置 */
export type GenerateControlsConfig = {
  /** 字段分组配置 */
  groups?: {
    Content?: string[];
    Style?: string[];
    Data?: string[];
    Advanced?: string[];
  };
  /** 覆盖控件类型 */
  overrides?: Record<string, Partial<ControlField>>;
  /** 绑定配置 */
  bindings?: Record<string, ControlBinding>;
};

/**
 * 从 Zod Schema 自动生成 Controls 配置
 */
export function generateControls(
  schema: z.ZodObject<ZodShape>,
  config: GenerateControlsConfig = {}
): WidgetControls {
  const shape = schema.shape;
  const { groups: groupConfig = {}, overrides = {}, bindings = {} } = config;

  // 收集所有字段
  const allFields: Record<string, ControlField> = {};
  
  for (const [key, zodType] of Object.entries(shape)) {
    const field: ControlField = {
      path: key,
      label: getZodDescription(zodType) ?? key,
      kind: zodTypeToKind(zodType),
      default: getZodDefault(zodType),
      options: getEnumOptions(zodType),
      binding: bindings[key],
      // 应用覆盖配置
      ...overrides[key],
    };
    allFields[key] = field;
  }

  // 构建分组
  const groups: ControlGroup[] = [];
  const usedKeys = new Set<string>();

  // 按配置顺序添加分组
  const groupOrder: Array<'Content' | 'Style' | 'Data' | 'Advanced'> = ['Content', 'Style', 'Data', 'Advanced'];
  
  for (const groupId of groupOrder) {
    const fieldKeys = groupConfig[groupId];
    if (fieldKeys && fieldKeys.length > 0) {
      const fields = fieldKeys
        .map((key) => allFields[key])
        .filter((field): field is ControlField => field !== undefined);
      
      fields.forEach((field) => usedKeys.add(field.path));
      
      if (fields.length > 0) {
        groups.push({
          id: groupId,
          label: groupId === 'Content' ? '内容' : 
                 groupId === 'Style' ? '样式' : 
                 groupId === 'Data' ? '数据' : '高级',
          fields,
        });
      }
    }
  }

  // 未分组的字段放入 Advanced
  const remainingFields = Object.entries(allFields)
    .filter(([key]) => !usedKeys.has(key))
    .map(([, field]) => field);
  
  if (remainingFields.length > 0) {
    const advancedGroup = groups.find((g) => g.id === 'Advanced');
    if (advancedGroup) {
      advancedGroup.fields.push(...remainingFields);
    } else {
      groups.push({
        id: 'Advanced',
        label: '高级',
        fields: remainingFields,
      });
    }
  }

  return { groups };
}
