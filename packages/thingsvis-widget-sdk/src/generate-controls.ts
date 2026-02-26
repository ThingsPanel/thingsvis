/**
 * generateControls - 从 Zod Schema 自动生成控件配置
 * 
 * 从每个插件的 lib/types.ts 中提取并统一
 */

import type { z } from 'zod';
import type {
  ControlField,
  ControlGroup,
  ControlGroupId,
  ControlKind,
  ControlOption,
  ControlBinding,
  WidgetControls,
} from './types';
import { zodTypeToKind, getZodDefault, getZodDescription, getEnumOptions } from './utils/zod-helpers';

// ============================================================================
// 配置类型
// ============================================================================

/** Controls 生成配置 */
export type GenerateControlsConfig = {
  /** 属性分组配置 */
  groups?: Partial<Record<ControlGroupId, string[]>>;
  /** 控件类型覆盖 */
  overrides?: Record<string, Partial<ControlField>>;
  /** 数据绑定配置 */
  bindings?: Record<string, ControlBinding>;
  /** 
   * 一键开启所有绑定
   * 设为 true 则所有字段自动支持 static/field/expr 绑定
   */
  enableAllBindings?: boolean;
  /** 排除的字段（不生成控件） */
  exclude?: string[];
};

// ============================================================================
// 主函数
// ============================================================================

type ZodShape = Record<string, z.ZodTypeAny>;

/**
 * 从 Zod Schema 自动生成 Controls 配置
 * 
 * @example
 * ```typescript
 * const controls = generateControls(PropsSchema, {
 *   groups: {
 *     Content: ['title'],
 *     Style: ['color', 'fontSize'],
 *   },
 *   overrides: {
 *     color: { kind: 'color' },
 *   },
 *   bindings: {
 *     title: { enabled: true, modes: ['static', 'field', 'expr'] },
 *   },
 * });
 * ```
 */
export function generateControls(
  schema: z.ZodObject<ZodShape>,
  config: GenerateControlsConfig = {}
): WidgetControls {
  const shape = schema.shape;
  const {
    groups: groupConfig = {},
    overrides = {},
    bindings = {},
    enableAllBindings = false,
    exclude = [],
  } = config;

  const defaultBinding: ControlBinding = { enabled: true, modes: ['static', 'field', 'expr'] };

  // 1. 从 Schema 生成所有字段
  const allFields: Record<string, ControlField> = {};

  for (const [key, zodType] of Object.entries(shape)) {
    // 跳过排除的字段
    if (exclude.includes(key)) continue;

    const field: ControlField = {
      path: key,
      label: getZodDescription(zodType) ?? key,
      kind: zodTypeToKind(zodType),
      default: getZodDefault(zodType),
      options: getEnumOptions(zodType),
      binding: enableAllBindings ? defaultBinding : bindings[key],
      // 应用覆盖
      ...overrides[key],
    };
    allFields[key] = field;
  }

  // 2. 按分组组织
  const groups: ControlGroup[] = [];
  const usedKeys = new Set<string>();
  const groupOrder: ControlGroupId[] = ['Content', 'Style', 'Data', 'Advanced'];

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
          label: getGroupLabel(groupId),
          expanded: true,
          fields,
        });
      }
    }
  }

  // 3. 未分组的字段放入 Advanced
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
        label: 'Advanced',
        expanded: false,
        fields: remainingFields,
      });
    }
  }

  return { groups };
}

// ============================================================================
// 辅助函数
// ============================================================================

function getGroupLabel(id: ControlGroupId): string {
  return id;
}
