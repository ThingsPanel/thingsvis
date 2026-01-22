/**
 * Zod schemas for project persistence
 * 
 * Defines the .thingsvis file format structure with validation
 */

import { z } from 'zod'

// =============================================================================
// Project Metadata Schema
// =============================================================================

export const ProjectMetaSchema = z.object({
  /** File format version - semver format */
  version: z.literal('1.0.0'),
  /** Project UUID */
  id: z.string().uuid(),
  /** User-defined project name */
  name: z.string().min(1).max(100),
  /** Unix timestamp (ms) when project was created */
  createdAt: z.number().int().positive(),
  /** Unix timestamp (ms) when project was last modified */
  updatedAt: z.number().int().positive(),
  /** Base64 JPEG thumbnail for recent projects list (max ~50KB) */
  thumbnail: z.string().max(70000).optional(),
})

// =============================================================================
// Canvas Configuration Schema
// =============================================================================

export const CanvasConfigSchema = z.object({
  /** Canvas layout mode */
  mode: z.enum(['fixed', 'infinite', 'reflow']),
  /** Canvas width in pixels */
  width: z.number().int().positive(),
  /** Canvas height in pixels */
  height: z.number().int().positive(),
  /** Background CSS color */
  background: z.string(),
  /** Grid column count (grid layout only) */
  gridCols: z.number().int().min(1).max(48).optional(),
  /** Grid row height in pixels (grid layout only) */
  gridRowHeight: z.number().int().positive().optional(),
  /** Grid gap in pixels (grid layout only) */
  gridGap: z.number().int().nonnegative().optional(),
  /** Whether grid is visible */
  gridEnabled: z.boolean().optional(),
  /** Grid cell size in pixels */
  gridSize: z.number().int().positive().optional(),
})

// =============================================================================
// Data Source Configuration Schema
// =============================================================================

export const DataSourceConfigSchema = z.object({
  /** Data source unique identifier */
  id: z.string(),
  /** Data source type (e.g., 'mqtt', 'rest', 'websocket') */
  type: z.string(),
  /** Type-specific configuration */
  config: z.record(z.unknown()),
})

// =============================================================================
// Project File Schema (Complete .thingsvis file)
// =============================================================================

/**
 * Complete project file schema for import/export and IndexedDB storage.
 * Note: nodes array uses z.any() here because NodeSchema comes from @thingsvis/schema
 * and is validated separately during import.
 */
export const ProjectFileSchema = z.object({
  /** Project metadata */
  meta: ProjectMetaSchema,
  /** Canvas configuration */
  canvas: CanvasConfigSchema,
  /** Array of nodes on the canvas */
  nodes: z.array(z.any()), // Validated separately with NodeSchema
  /** Array of data source configurations */
  dataSources: z.array(DataSourceConfigSchema),
})

// =============================================================================
// Recent Project Entry Schema
// =============================================================================

export const RecentProjectEntrySchema = z.object({
  /** Project UUID - references full project in IndexedDB */
  id: z.string().uuid(),
  /** Display name for recent projects list */
  name: z.string(),
  /** Base64 thumbnail for visual preview */
  thumbnail: z.string(),
  /** Unix timestamp for sorting (most recent first) */
  updatedAt: z.number(),
})

// =============================================================================
// Type Exports
// =============================================================================

export type ProjectFile = z.infer<typeof ProjectFileSchema>
export type ProjectMeta = z.infer<typeof ProjectMetaSchema>
export type CanvasConfig = z.infer<typeof CanvasConfigSchema>
export type DataSourceConfig = z.infer<typeof DataSourceConfigSchema>
export type RecentProjectEntry = z.infer<typeof RecentProjectEntrySchema>
