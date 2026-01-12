/**
 * Zod 辅助工具函数
 * 
 * 从 Zod Schema 提取类型信息
 */

import type { z } from 'zod';
import type { ControlKind, ControlOption } from '../types';

/**
 * 将 Zod 类型映射到控件类型
 */
export function zodTypeToKind(zodType: z.ZodTypeAny): ControlKind {
  const typeName = getZodTypeName(zodType);

  switch (typeName) {
    case 'ZodNumber':
      return 'number';
    case 'ZodBoolean':
      return 'boolean';
    case 'ZodEnum':
      return 'select';
    case 'ZodObject':
    case 'ZodArray':
    case 'ZodRecord':
      return 'json';
    case 'ZodString':
    default:
      return 'string';
  }
}

/**
 * 获取 Zod Schema 的默认值
 */
export function getZodDefault(zodType: z.ZodTypeAny): unknown {
  const def = zodType._def;

  if (def?.typeName === 'ZodDefault') {
    return def.defaultValue();
  }

  if (def?.innerType) {
    return getZodDefault(def.innerType);
  }

  return undefined;
}

/**
 * 获取 Zod Schema 的描述
 */
export function getZodDescription(zodType: z.ZodTypeAny): string | undefined {
  // 优先从 _def.description 获取
  if (zodType._def?.description) {
    return zodType._def.description;
  }

  // 递归获取内部类型的描述
  if (zodType._def?.innerType) {
    return getZodDescription(zodType._def.innerType);
  }

  return undefined;
}

/**
 * 获取 Zod Enum 的选项
 */
export function getEnumOptions(zodType: z.ZodTypeAny): ControlOption[] | undefined {
  let innerType = zodType;

  // 递归解包 ZodDefault, ZodOptional 等
  while (innerType._def?.innerType) {
    innerType = innerType._def.innerType;
  }

  if (getZodTypeName(innerType) === 'ZodEnum') {
    const values = innerType._def.values as string[];
    return values.map((v) => ({ label: v, value: v }));
  }

  return undefined;
}

/**
 * 获取 Zod 类型名称
 */
function getZodTypeName(zodType: z.ZodTypeAny): string {
  let current = zodType;

  // 解包 ZodDefault, ZodOptional, ZodNullable 等
  while (current._def?.innerType) {
    const typeName = current._def.typeName;
    if (typeName && !['ZodDefault', 'ZodOptional', 'ZodNullable'].includes(typeName)) {
      return typeName;
    }
    current = current._def.innerType;
  }

  return current._def?.typeName ?? 'ZodUnknown';
}
