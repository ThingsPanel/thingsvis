import type { Page, Node, SelectionState } from "../canvas-schema";

// Public TypeScript contract types for Canvas Kernel integrations
export type CanvasPage = Page;
export type CanvasNode = Node;
export type CanvasSelectionState = SelectionState;

export interface RegisterPluginMeta {
  pluginId: string;
  version?: string;
  capabilities?: string[];
}

export type Patch = { nodeId: string; patch: Partial<CanvasNode> };


