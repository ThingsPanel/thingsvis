import type {
  PageSchemaType,
  NodeSchemaType,
  IPage,
  IPageConfig,
  GridSettings,
  GridPosition,
  IBaseStyle,
} from '@thingsvis/schema';
import type { DashboardVariable } from '../variables/types';
import type { StoreApi } from 'zustand/vanilla';
import type { TemporalState } from 'zundo';

export type SelectionState = {
  nodeIds: string[];
};

export type CanvasState = {
  mode: 'fixed' | 'infinite' | 'grid';
  width: number;
  height: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type GridState = {
  settings: GridSettings | null;
  activeBreakpoint: { minWidth: number; cols: number } | null;
  colWidth: number;
  containerWidth: number;
  effectiveCols: number;
  preview: {
    active: boolean;
    itemId: string | null;
    targetPosition: GridPosition | null;
    affectedItems: string[];
  };
  totalHeight: number;
};

export type NodeState = {
  id: string;
  schemaRef: NodeSchemaType;
  visible: boolean;
  locked: boolean;
  runtimeData?: Record<string, unknown>;
  error?: string;
};

export type ConnectionState = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceAnchor?: string;
  targetAnchor?: string;
  props?: Record<string, unknown>;
};

export type DataSourceRuntimeState = {
  id: string;
  data: unknown;
  status: 'idle' | 'connected' | 'disconnected' | 'error' | 'loading';
  error?: string;
  lastUpdated: number;
};

export type LayerGroup = {
  id: string;
  name: string;
  expanded: boolean;
  locked: boolean;
  visible: boolean;
  memberIds: string[];
};

export type KernelState = {
  page?: IPage | PageSchemaType;
  nodesById: Record<string, NodeState>;
  connections: ConnectionState[];
  selection: SelectionState;
  canvas: CanvasState;
  dataSources: Record<string, DataSourceRuntimeState>;
  layerOrder: string[];
  layerGroups: Record<string, LayerGroup>;
  gridState: GridState;
  variableDefinitions: DashboardVariable[];
  variableValues: Record<string, unknown>;
};

export type KernelActions = {
  loadPage: (page: IPage | PageSchemaType) => void;
  addNodes: (nodes: NodeSchemaType[]) => void;
  removeNodes: (nodeIds: string[]) => void;
  selectNode: (nodeId: string | null) => void;
  selectNodes: (nodeIds: string[]) => void;
  toggleNodeSelection: (nodeId: string) => void;
  updateNode: (
    nodeId: string,
    changes: {
      position?: { x: number; y: number };
      size?: { width: number; height: number };
      props?: Record<string, unknown>;
      locked?: boolean;
      data?: unknown[];
      events?: unknown[];
      grid?: { x: number; y: number; w: number; h: number };
      baseStyle?: IBaseStyle;
    },
  ) => void;
  setNodeError: (nodeId: string, error: string) => void;
  addConnection: (conn: Omit<ConnectionState, 'id'>) => void;
  removeConnection: (connId: string) => void;
  updateCanvas: (changes: Partial<CanvasState>) => void;

  setDataSourceState: (id: string, state: Partial<DataSourceRuntimeState>) => void;
  updateDataSourceData: (id: string, data: unknown) => void;
  removeDataSourceFromStore: (id: string) => void;

  setNodeVisible: (nodeId: string, visible: boolean) => void;
  setNodeLocked: (nodeId: string, locked: boolean) => void;
  renameNode: (nodeId: string, name: string) => void;
  reorderLayers: (nodeId: string, targetIndex: number) => void;
  bringToFront: (nodeIds: string[]) => void;
  sendToBack: (nodeIds: string[]) => void;
  bringForward: (nodeIds: string[]) => void;
  sendBackward: (nodeIds: string[]) => void;

  createGroup: (nodeIds: string[], groupName?: string) => string;
  ungroup: (groupId: string) => void;
  toggleGroupExpanded: (groupId: string) => void;
  setGroupVisible: (groupId: string, visible: boolean) => void;
  setGroupLocked: (groupId: string, locked: boolean) => void;
  renameGroup: (groupId: string, name: string) => void;

  setGridSettings: (settings: Partial<GridSettings>) => void;
  moveGridItem: (nodeId: string, newPos: { x: number; y: number }) => void;
  resizeGridItem: (nodeId: string, newSize: { w: number; h: number }) => void;
  compactGrid: () => void;
  setGridPreview: (preview: {
    active: boolean;
    itemId: string | null;
    targetPosition: GridPosition | null;
    affectedItems: string[];
  }) => void;
  updateGridContainerWidth: (containerWidth: number) => void;
  /** Move a grid item and synchronize schema.position/size from the resulting grid coordinates */
  moveGridItemWithPosition: (nodeId: string, newPos: { x: number; y: number }) => void;
  /** Resize a grid item and synchronize schema.position/size from the resulting grid coordinates */
  resizeGridItemWithPosition: (nodeId: string, newSize: { w: number; h: number }) => void;

  setVariableDefinitions: (defs: DashboardVariable[]) => void;
  initVariablesFromDefinitions: (defs: DashboardVariable[]) => void;
  setVariableValue: (name: string, value: unknown) => void;
  updatePageConfig: (configPartial: Partial<IPageConfig>) => void;
};

export type KernelStoreState = KernelState & KernelActions;

export type KernelStore = StoreApi<KernelStoreState> & {
  temporal: StoreApi<TemporalState<KernelStoreState>>;
};
