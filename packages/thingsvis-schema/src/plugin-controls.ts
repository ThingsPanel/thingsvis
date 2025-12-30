import { z } from 'zod';

/**
 * Serializable Controls contract (Plugin -> Studio)
 *
 * IMPORTANT: This file must remain React-free.
 */

export const BindingModeSchema = z.enum(['static', 'field', 'expr', 'rule']);
export type BindingMode = z.infer<typeof BindingModeSchema>;

export const ControlKindSchema = z.enum(['string', 'number', 'boolean', 'color', 'select', 'json']);
export type ControlKind = z.infer<typeof ControlKindSchema>;

export const ControlOptionSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()])
});
export type ControlOption = z.infer<typeof ControlOptionSchema>;

export const ControlBindingSchema = z.object({
  enabled: z.boolean(),
  modes: z.array(BindingModeSchema)
});
export type ControlBinding = z.infer<typeof ControlBindingSchema>;

export const ControlFieldSchema = z.object({
  /**
   * MVP: flat prop key (maps to DataBinding.targetProp)
   */
  path: z.string().min(1),
  label: z.string().min(1),
  kind: ControlKindSchema,
  options: z.array(ControlOptionSchema).optional(),
  default: z.unknown().optional(),
  binding: ControlBindingSchema.optional()
});
export type ControlField = z.infer<typeof ControlFieldSchema>;

export const ControlGroupIdSchema = z.enum(['Content', 'Style', 'Data', 'Advanced']);
export type ControlGroupId = z.infer<typeof ControlGroupIdSchema>;

export const ControlGroupSchema = z.object({
  id: ControlGroupIdSchema,
  label: z.string().optional(),
  fields: z.array(ControlFieldSchema)
});
export type ControlGroup = z.infer<typeof ControlGroupSchema>;

export const PluginControlsSchema = z.object({
  groups: z.array(ControlGroupSchema)
});
export type PluginControls = z.infer<typeof PluginControlsSchema>;
