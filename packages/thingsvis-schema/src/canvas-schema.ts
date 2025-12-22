import { z } from "zod";

export const Transform3DSchema = z.object({
  rx: z.number().optional(),
  ry: z.number().optional(),
  rz: z.number().optional(),
  perspective: z.number().optional(),
});

export const NodeSchema = z.object({
  id: z.string(),
  pluginId: z.string(),
  props: z.record(z.any()).optional().default({}),
  x: z.number(),
  y: z.number(),
  width: z.number().optional().default(0),
  height: z.number().optional().default(0),
  rotation: z.number().optional().default(0),
  scaleX: z.number().optional().default(1),
  scaleY: z.number().optional().default(1),
  transform3D: Transform3DSchema.optional(),
  zIndex: z.number().optional().default(0),
  visible: z.boolean().optional().default(true),
  groupId: z.string().optional(),
});

export const SelectionStateSchema = z.object({
  selectedIds: z.array(z.string()),
  primarySelectionId: z.string().optional(),
  selectionBounds: z
    .object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() })
    .optional(),
  transformHandle: z.object({ mode: z.union([z.literal("translate"), z.literal("scale"), z.literal("rotate"), z.literal("skew")]) }),
});

export const GroupSchema = z.object({
  id: z.string(),
  memberIds: z.array(z.string()),
});

export const ErrorBoundaryContextSchema = z.object({
  pluginId: z.string(),
  nodeId: z.string(),
  error: z
    .object({ message: z.string(), stack: z.string().optional(), time: z.number() })
    .optional(),
  fallbackUI: z.record(z.any()).optional(),
});

export const PageSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  mode: z.union([z.literal("Fixed"), z.literal("Infinite"), z.literal("Reflow")]),
  width: z.number().optional(),
  height: z.number().optional(),
  layoutRules: z.record(z.any()).optional(),
  nodes: z.array(NodeSchema).optional().default([]),
  meta: z.record(z.any()).optional().default({}),
});

export type Page = z.infer<typeof PageSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type SelectionState = z.infer<typeof SelectionStateSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type ErrorBoundaryContext = z.infer<typeof ErrorBoundaryContextSchema>;


