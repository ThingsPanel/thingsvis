import type { StateCreator } from 'zustand/vanilla';
import type { KernelState, KernelActions, NodeState, LayerGroup } from '../types';
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

function normalizeLayerOrder(config: Record<string, unknown>, nodes: NodeSchemaType[]): string[] {
  const nodeIds = nodes.map((node) => node.id);
  const nodeIdSet = new Set(nodeIds);
  const configuredOrder = Array.isArray(config.layerOrder)
    ? config.layerOrder.filter((id): id is string => typeof id === 'string' && nodeIdSet.has(id))
    : [];
  const configuredIdSet = new Set(configuredOrder);
  const missingIds = nodeIds.filter((id) => !configuredIdSet.has(id));
  return [...configuredOrder, ...missingIds];
}

function normalizeLayerGroups(
  config: Record<string, unknown>,
  nodeIds: string[],
): Record<string, LayerGroup> {
  if (
    !config.layerGroups ||
    typeof config.layerGroups !== 'object' ||
    Array.isArray(config.layerGroups)
  ) {
    return {};
  }

  const nodeIdSet = new Set(nodeIds);
  const groups: Record<string, LayerGroup> = {};
  Object.entries(config.layerGroups as Record<string, unknown>).forEach(([groupId, rawGroup]) => {
    if (!rawGroup || typeof rawGroup !== 'object' || Array.isArray(rawGroup)) return;
    const group = rawGroup as Record<string, unknown>;
    const memberIds = Array.isArray(group.memberIds)
      ? group.memberIds.filter((id): id is string => typeof id === 'string' && nodeIdSet.has(id))
      : [];
    if (memberIds.length === 0) return;

    groups[groupId] = {
      id: typeof group.id === 'string' ? group.id : groupId,
      name: typeof group.name === 'string' && group.name.trim() ? group.name : groupId,
      expanded: group.expanded !== false,
      locked: group.locked === true,
      visible: group.visible !== false,
      memberIds,
    };
  });

  return groups;
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
        gridEnabled: Boolean(config.gridEnabled),
        gridSize: typeof config.gridSize === 'number' ? config.gridSize : defaultCanvas.gridSize,
      } as typeof state.canvas;
      state.layerOrder = normalizeLayerOrder(config, nodes);
      state.layerGroups = normalizeLayerGroups(config, state.layerOrder);
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
      if (configPartial.gridEnabled !== undefined) {
        state.canvas.gridEnabled = Boolean(configPartial.gridEnabled);
      }
      if (configPartial.gridSize !== undefined) {
        state.canvas.gridSize = Number(configPartial.gridSize);
      }
    });
  },
});
