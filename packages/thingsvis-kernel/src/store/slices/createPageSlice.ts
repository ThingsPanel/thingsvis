import type { StateCreator } from 'zustand/vanilla';
import type { KernelState, KernelActions, NodeState } from '../types';
import type { NodeSchemaType, IPage } from '@thingsvis/schema';
import { PageSchema } from '@thingsvis/schema';
import { defaultCanvas } from './createCanvasSlice';
import { CANVAS_DEFAULT_WIDTH, CANVAS_DEFAULT_HEIGHT } from '../../constants/default';

export type PageSliceState = {
  page?: KernelState['page'];
};

export type PageSliceActions = Pick<KernelActions, 'loadPage' | 'updatePageConfig'>;

export type PageSlice = PageSliceState & PageSliceActions;

/**
 * Extract nodes array from a page payload, supporting both
 * the canonical `IPage` shape (`content.nodes`) and the legacy
 * `PageSchemaType` shape (flat `nodes`).
 */
function extractNodes(page: IPage | Record<string, unknown>): NodeSchemaType[] {
  if ('content' in page && page.content && typeof page.content === 'object') {
    return (page.content as { nodes?: NodeSchemaType[] }).nodes ?? [];
  }
  if ('nodes' in page && Array.isArray(page.nodes)) {
    return page.nodes as NodeSchemaType[];
  }
  return [];
}

/**
 * Extract config object from a page payload.
 */
function extractConfig(page: IPage | Record<string, unknown>): Record<string, unknown> {
  if ('config' in page && page.config && typeof page.config === 'object') {
    return page.config as Record<string, unknown>;
  }
  return {};
}

export const createPageSlice: StateCreator<
  KernelState & KernelActions,
  [['zustand/immer', never]],
  [],
  PageSlice
> = (set) => ({
  page: undefined,

  loadPage: (page) => {
    // ── Validate with Zod (canonical IPage schema) ──
    const parsed = PageSchema.safeParse(page);

    const validPage = parsed.success ? parsed.data : page;
    const nodes = extractNodes(validPage as IPage | Record<string, unknown>);
    const config = extractConfig(validPage as IPage | Record<string, unknown>);

    const nodesById: Record<string, NodeState> = {};
    nodes.forEach((node: NodeSchemaType) => {
      nodesById[node.id] = {
        id: node.id,
        schemaRef: node,
        visible: true,
        locked: false,
      };
    });

    set((state) => {
      state.page = validPage as IPage;
      state.nodesById = nodesById;
      state.connections = (validPage as any).connections ?? [];
      state.selection = { nodeIds: [] };
      state.canvas = {
        ...defaultCanvas,
        mode: (config.mode as string) || 'infinite',
        width: (config.width as number) || CANVAS_DEFAULT_WIDTH,
        height: (config.height as number) || CANVAS_DEFAULT_HEIGHT,
      } as typeof state.canvas;
      // Initialize layer order from nodes
      state.layerOrder = nodes.map((n: NodeSchemaType) => n.id);
      state.layerGroups = {};
    });
  },

  updatePageConfig: (configPartial) => {
    set((state) => {
      if (!state.page) return;
      if ('config' in state.page) {
        state.page.config = {
          ...state.page.config,
          ...configPartial,
          // @ts-ignore - Temporary cast to handle recursive depth issue
        } as any;
      }
      // Update canvas state if mode, width, or height are changed
      if (configPartial.mode) state.canvas.mode = configPartial.mode as any;
      if (configPartial.width !== undefined) state.canvas.width = configPartial.width;
      if (configPartial.height !== undefined) state.canvas.height = configPartial.height;
    });
  },
});
