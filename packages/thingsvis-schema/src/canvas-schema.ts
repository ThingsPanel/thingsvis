import { z } from 'zod';

/**
 * @deprecated Use `NodeSchema` from `node-schema.ts` instead.
 * This schema will be removed in the next major version.
 */
export const Transform3DSchema = z.object({
  rx: z.number().optional(),
  ry: z.number().optional(),
  rz: z.number().optional(),
  perspective: z.number().optional(),
});

/**
 * @deprecated Use `NodeSchema` from `node-schema.ts` instead.
 * This schema will be removed in the next major version.
 */
export const NodeSchema = z.object({
  id: z.string(),
  widgetId: z.string(),
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

/**
 * @deprecated Use selection state from the kernel store slices instead.
 * This schema will be removed in the next major version.
 */
export const SelectionStateSchema = z.object({
  selectedIds: z.array(z.string()),
  primarySelectionId: z.string().optional(),
  selectionBounds: z
    .object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() })
    .optional(),
  transformHandle: z.object({
    mode: z.union([
      z.literal('translate'),
      z.literal('scale'),
      z.literal('rotate'),
      z.literal('skew'),
    ]),
  }),
});

/**
 * @deprecated Use group handling from the kernel store slices instead.
 * This schema will be removed in the next major version.
 */
export const GroupSchema = z.object({
  id: z.string(),
  memberIds: z.array(z.string()),
});

/**
 * @deprecated Use `WidgetErrorBoundary` component from `@thingsvis/ui` instead.
 * This schema will be removed in the next major version.
 */
export const ErrorBoundaryContextSchema = z.object({
  widgetId: z.string(),
  nodeId: z.string(),
  error: z
    .object({ message: z.string(), stack: z.string().optional(), time: z.number() })
    .optional(),
  fallbackUI: z.record(z.any()).optional(),
});

/**
 * @deprecated Use `PageSchema` from `page-schema.ts` (or `page.ts`) instead.
 * This schema will be removed in the next major version.
 */
export const PageSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  mode: z.union([z.literal('Fixed'), z.literal('Infinite'), z.literal('Reflow')]),
  width: z.number().optional(),
  height: z.number().optional(),
  layoutRules: z.record(z.any()).optional(),
  nodes: z.array(NodeSchema).optional().default([]),
  meta: z.record(z.any()).optional().default({}),
});

/** @deprecated Use `PageSchemaType` from `page-schema.ts` instead. */
export type Page = z.infer<typeof PageSchema>;
/** @deprecated Use `NodeSchemaType` from `node-schema.ts` instead. */
export type Node = z.infer<typeof NodeSchema>;
/** @deprecated Use selection state from the kernel store slices instead. */
export type SelectionState = z.infer<typeof SelectionStateSchema>;
/** @deprecated Use group handling from the kernel store slices instead. */
export type Group = z.infer<typeof GroupSchema>;
/** @deprecated Use `WidgetErrorBoundary` component from `@thingsvis/ui` instead. */
export type ErrorBoundaryContext = z.infer<typeof ErrorBoundaryContextSchema>;
