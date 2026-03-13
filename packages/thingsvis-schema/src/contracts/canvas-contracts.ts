import type { PageSchemaType } from '../page-schema';
import type { NodeSchemaType } from '../node-schema';

// Public TypeScript contract types for Canvas Kernel integrations
export type CanvasPage = PageSchemaType;
export type CanvasNode = NodeSchemaType;
export type CanvasSelectionState = { nodeIds: string[] };

export interface RegisterPluginMeta {
  /** Widget type identifier (e.g. 'echarts-bar', 'basic/text') */
  type: string;
  version?: string;
  capabilities?: string[];
}

export type Patch = { nodeId: string; patch: Partial<CanvasNode> };
