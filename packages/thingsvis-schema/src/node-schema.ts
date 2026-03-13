import { z } from 'zod';
import { DataBindingSchema } from './datasource/index';
import { GridPositionSchema } from './grid';
import { BaseStyleSchema } from './style';

export const NodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string().optional(),
  props: z.record(z.unknown()).optional(),
  style: z.record(z.unknown()).optional(),
  baseStyle: BaseStyleSchema.optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z
    .object({
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  rotation: z.number().optional(),
  parentId: z.string().optional(),
  data: z.array(DataBindingSchema).optional(),
  events: z.array(z.record(z.unknown())).optional(),
  // Grid layout position (for grid layout mode)
  grid: GridPositionSchema.optional(),
  /** 保存时的 widget 版本，用于属性迁移 */
  widgetVersion: z.string().optional(),
});

export type NodeSchemaType = z.infer<typeof NodeSchema>;
