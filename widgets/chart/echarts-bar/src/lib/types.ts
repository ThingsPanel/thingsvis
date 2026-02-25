/**
 * 插件内部类型定义 (Overlay 版本)
 * 
 * ⚠️ 此文件由模板生成，开发者无需修改
 * 
 * 说明：
 * - 此模板用于需要 DOM 容器的组件（ECharts、视频、3D 等）
 * - 使用 createOverlay 而非 create
 */

import type { z } from 'zod';

// ============================================================================
// 控件类型定义
// ============================================================================

/** 绑定模式：静态值 | 字段选择 | 表达式 | 规则 */
export type BindingMode = 'static' | 'field' | 'expr' | 'rule';

/** 控件类型 */
export type ControlKind = 'string' | 'number' | 'boolean' | 'color' | 'select' | 'json';

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
// Overlay 相关类型
// ============================================================================

/** DOM Overlay 上下文 */
export type WidgetOverlayContext = {
  /** 位置（画布坐标） */
  position?: { x: number; y: number };
  /** 尺寸 */
  size?: { width: number; height: number };
  /** 组件属性（已解析） */
  props?: Record<string, unknown>;
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
// 插件主模块类型 (Overlay 版本)
// ============================================================================

/**
 * 插件主模块接口 (Overlay 版本)
 * 
 * 与 Leafer 版本的区别：
 * - 使用 createOverlay 而非 create
 * - 返回包含 DOM 元素和生命周期方法的对象
 */
export type WidgetMainModule = {
  /** 组件唯一标识 */
  id: string;
  /** 组件显示名称 */
  name?: string;
  /** 组件分类 */
  category?: string;
  /** 图标名称（Lucide 图标） */
  icon?: string;
  /** 版本号 */
  version?: string;
  /** Zod Schema */
  schema?: z.ZodType<unknown>;
  /** 控件配置 */
  controls?: WidgetControls;
  /** 
   * 创建 DOM Overlay
   * 
   * @param ctx - 上下文（位置、尺寸、属性）
   * @returns Overlay 实例
   */
  createOverlay: (ctx: WidgetOverlayContext) => PluginOverlayInstance;
};

// ============================================================================
// 工具函数：从 Zod Schema 生成 Controls
// ============================================================================

type ZodShape = Record<string, z.ZodTypeAny>;

function zodTypeToKind(zodType: z.ZodTypeAny): ControlKind {
  const typeName = zodType._def?.typeName;
  switch (typeName) {
    case 'ZodNumber': return 'number';
    case 'ZodBoolean': return 'boolean';
    case 'ZodEnum': return 'select';
    case 'ZodObject':
    case 'ZodArray': return 'json';
    default: return 'string';
  }
}

function getZodDefault(zodType: z.ZodTypeAny): unknown {
  if (zodType._def?.typeName === 'ZodDefault') {
    return zodType._def.defaultValue();
  }
  if (zodType._def?.innerType) {
    return getZodDefault(zodType._def.innerType);
  }
  return undefined;
}

function getZodDescription(zodType: z.ZodTypeAny): string | undefined {
  return zodType._def?.description ?? zodType.description;
}

function getEnumOptions(zodType: z.ZodTypeAny): ControlOption[] | undefined {
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
  groups?: {
    Content?: string[];
    Style?: string[];
    Data?: string[];
    Advanced?: string[];
  };
  overrides?: Record<string, Partial<ControlField>>;
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

  const allFields: Record<string, ControlField> = {};
  
  for (const [key, zodType] of Object.entries(shape)) {
    const field: ControlField = {
      path: key,
      label: getZodDescription(zodType) ?? key,
      kind: zodTypeToKind(zodType),
      default: getZodDefault(zodType),
      options: getEnumOptions(zodType),
      binding: bindings[key],
      ...overrides[key],
    };
    allFields[key] = field;
  }

  const groups: ControlGroup[] = [];
  const usedKeys = new Set<string>();
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

  const remainingFields = Object.entries(allFields)
    .filter(([key]) => !usedKeys.has(key))
    .map(([, field]) => field);
  
  if (remainingFields.length > 0) {
    const advancedGroup = groups.find((g) => g.id === 'Advanced');
    if (advancedGroup) {
      advancedGroup.fields.push(...remainingFields);
    } else {
      groups.push({ id: 'Advanced', label: '高级', fields: remainingFields });
    }
  }

  return { groups };
}
