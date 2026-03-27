import { z } from 'zod';

/**
 * Serializable Controls contract (Plugin -> Studio)
 *
 * IMPORTANT: This file must remain React-free.
 */

/**
 * i18n label: 可以是简单字符串，也可以是多语言 map
 * 简单字符串: Studio 会尝试把它当 i18n key 查找，找不到则原文输出
 * 多语言 map: Studio 按当前语言取对应字段，第三方 SDK 组件不需要在 locale 文件里注册
 * 示例: { en: 'Primary Color', zh: '主色调' }
 */
export const I18nLabelSchema = z.union([z.string().min(1), z.record(z.string(), z.string())]);
export type I18nLabel = z.infer<typeof I18nLabelSchema>;
export const ControlTextSchema = I18nLabelSchema;
export type ControlText = I18nLabel;

export const BindingModeSchema = z.enum(['static', 'field', 'expr', 'rule']);
export type BindingMode = z.infer<typeof BindingModeSchema>;

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
export const ControlKindSchema = z.enum([
  // 基础
  'string',
  'number',
  'boolean',
  'textarea',
  // 颜色
  'color',
  'gradient',
  'colorScheme',
  // 选择
  'select',
  'multiSelect',
  'radio',
  'segmented',
  // 复杂
  'json',
  'code',
  'expression',
  // 特殊
  'image',
  'icon',
  'font',
  // 数据
  'dataField',
  'dataSource',
  'nodeSelect',
  // 布局
  'slider',
  'rangeSlider',
  'margin',
  'padding',
]);
export type ControlKind = z.infer<typeof ControlKindSchema>;

export const ControlOptionSchema = z.object({
  label: I18nLabelSchema,
  value: z.union([z.string(), z.number()]),
  /** Lucide 图标名称（用于 segmented 等控件） */
  icon: z.string().optional(),
});
export type ControlOption = z.infer<typeof ControlOptionSchema>;

export const ControlBindingSchema = z.object({
  enabled: z.boolean(),
  modes: z.array(BindingModeSchema),
});
export type ControlBinding = z.infer<typeof ControlBindingSchema>;

export const ControlFieldSchema = z.object({
  /** 属性路径（映射到 props 的 key） */
  path: z.string().min(1),
  /** 显示标签（支持字符串 i18n key 或 { en, zh, ... } 多语言 map） */
  label: I18nLabelSchema,
  /** 控件类型 */
  kind: ControlKindSchema,
  /** 下拉选项（select/multiSelect/radio/segmented 使用） */
  options: z.array(ControlOptionSchema).optional(),
  /** 默认值 */
  default: z.unknown().optional(),
  /** 数据绑定配置 */
  binding: ControlBindingSchema.optional(),
  /** 占位提示文字 */
  placeholder: ControlTextSchema.optional(),
  /** 描述/帮助文字 */
  description: ControlTextSchema.optional(),
  /** 是否禁用 */
  disabled: z.boolean().optional(),
  /** 条件显示（依赖其他字段） */
  showWhen: z
    .object({
      field: z.string(),
      value: z.unknown(),
    })
    .optional(),
  /** 数值范围（slider/number 使用） */
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
});
export type ControlField = z.infer<typeof ControlFieldSchema>;

/** 标准分组 ID */
export const ControlGroupIdSchema = z.string();
export type ControlGroupId = z.infer<typeof ControlGroupIdSchema>;

export const ControlGroupSchema = z.object({
  id: ControlGroupIdSchema,
  label: I18nLabelSchema.optional(),
  /** 是否默认展开 */
  expanded: z.boolean().optional(),
  showWhen: z
    .object({
      field: z.string(),
      value: z.unknown(),
    })
    .optional(),
  fields: z.array(ControlFieldSchema),
});
export type ControlGroup = z.infer<typeof ControlGroupSchema>;

export const WidgetControlsSchema = z.object({
  groups: z.array(ControlGroupSchema),
});
export type WidgetControls = z.infer<typeof WidgetControlsSchema>;

/**
 * Property paths managed exclusively by BaseStylePanel.
 * Widget controls MUST NOT define fields with these paths.
 * Enforced at validation time by getWidgetControls() in Studio.
 */
export const BASE_STYLE_MANAGED_PATHS: ReadonlySet<string> = new Set([
  'backgroundColor',
  'backgroundImage',
  'borderWidth',
  'borderColor',
  'borderStyle',
  'shadowBlur',
  'shadowColor',
  'shadowOffsetX',
  'shadowOffsetY',
  'opacity',
  'padding',
]);
