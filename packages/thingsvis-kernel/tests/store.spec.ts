import { describe, it, expect, beforeEach } from 'vitest';
import { createKernelStore } from '../src/store/KernelStore';

describe('KernelStore', () => {
    let useStore: ReturnType<typeof createKernelStore>;

    beforeEach(() => {
        useStore = createKernelStore();
    });

    describe('Canvas & Page Management', () => {
        it('should initialize with default canvas state', () => {
            const state = useStore.getState();
            expect(state.canvas.mode).toBe('infinite');
            expect(state.canvas.width).toBe(1920);
            expect(state.canvas.height).toBe(1080);
            expect(state.page).toBeUndefined();
        });

        it('should load a page correctly', () => {
            const mockPage = {
                config: { mode: 'grid', width: 800, height: 600 },
                nodes: [
                    { id: 'node-1', type: 'basic/rect' },
                    { id: 'node-2', type: 'basic/text' }
                ],
                connections: []
            } as any;

            useStore.getState().loadPage(mockPage);
            const state = useStore.getState();

            expect(state.page).toEqual(mockPage);
            expect(state.canvas.mode).toBe('grid');
            expect(state.canvas.width).toBe(800);
            expect(state.canvas.height).toBe(600);
            expect(Object.keys(state.nodesById)).toHaveLength(2);
            expect(state.layerOrder).toEqual(['node-1', 'node-2']);
        });

        it('should update canvas state', () => {
            useStore.getState().updateCanvas({ zoom: 1.5, offsetX: 100 });
            const state = useStore.getState();
            expect(state.canvas.zoom).toBe(1.5);
            expect(state.canvas.offsetX).toBe(100);
            expect(state.canvas.offsetY).toBe(0); // unchanged
        });
    });

    describe('Node Operations', () => {
        beforeEach(() => {
            const mockPage = {
                config: {},
                nodes: [{ id: 'node-1', type: 'test' }],
            } as any;
            useStore.getState().loadPage(mockPage);
        });

        it('should add nodes', () => {
            useStore.getState().addNodes([{ id: 'node-2', type: 'test2' } as any]);
            const state = useStore.getState();
            expect(state.nodesById['node-2']).toBeDefined();
            expect(state.nodesById['node-2'].id).toBe('node-2');
            expect(state.layerOrder).toContain('node-2');
        });

        it('should remove nodes and clear selection', () => {
            useStore.getState().addNodes([{ id: 'node-2', type: 'test2' } as any]);
            useStore.getState().selectNode('node-1');
            useStore.getState().removeNodes(['node-1']);

            const state = useStore.getState();
            expect(state.nodesById['node-1']).toBeUndefined();
            expect(state.layerOrder).not.toContain('node-1');
            expect(state.selection.nodeIds).not.toContain('node-1');
        });

        it('should update node properties', () => {
            useStore.getState().updateNode('node-1', {
                position: { x: 100, y: 200 },
                size: { width: 50, height: 50 },
                locked: true,
            });

            const state = useStore.getState();
            const node = state.nodesById['node-1'];
            const schema = node.schemaRef as any;

            expect(schema.position.x).toBe(100);
            expect(schema.size.width).toBe(50);
            expect(node.locked).toBe(true);
        });

        it('should set node error', () => {
            useStore.getState().setNodeError('node-1', 'Test Error');
            expect(useStore.getState().nodesById['node-1'].error).toBe('Test Error');
        });

        it('should toggle node visibility and lock status', () => {
            useStore.getState().setNodeVisible('node-1', false);
            expect(useStore.getState().nodesById['node-1'].visible).toBe(false);

            useStore.getState().setNodeLocked('node-1', true);
            expect(useStore.getState().nodesById['node-1'].locked).toBe(true);
        });

        it('should rename node', () => {
            useStore.getState().renameNode('node-1', 'New Name');
            expect((useStore.getState().nodesById['node-1'].schemaRef as any).name).toBe('New Name');
        });
    });

    describe('Selection Management', () => {
        beforeEach(() => {
            useStore.getState().addNodes([
                { id: 'node-1', type: 'test' } as any,
                { id: 'node-2', type: 'test' } as any,
            ]);
        });

        it('should select single node', () => {
            useStore.getState().selectNode('node-1');
            expect(useStore.getState().selection.nodeIds).toEqual(['node-1']);

            useStore.getState().selectNode(null);
            expect(useStore.getState().selection.nodeIds).toEqual([]);
        });

        it('should select multiple nodes', () => {
            useStore.getState().selectNodes(['node-1', 'node-2']);
            expect(useStore.getState().selection.nodeIds).toEqual(['node-1', 'node-2']);
        });

        it('should toggle node selection', () => {
            useStore.getState().toggleNodeSelection('node-1');
            expect(useStore.getState().selection.nodeIds).toEqual(['node-1']);

            useStore.getState().toggleNodeSelection('node-1');
            expect(useStore.getState().selection.nodeIds).toEqual([]);

            useStore.getState().toggleNodeSelection('node-2');
            expect(useStore.getState().selection.nodeIds).toEqual(['node-2']);
        });
    });

    describe('Connection Management', () => {
        beforeEach(() => {
            useStore.getState().addNodes([
                { id: 'node-1', type: 'test', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } } as any,
                { id: 'node-2', type: 'test', position: { x: 200, y: 0 }, size: { width: 100, height: 100 } } as any,
            ]);
        });

        it('should add connection with default path', () => {
            useStore.getState().addConnection({
                sourceNodeId: 'node-1',
                targetNodeId: 'node-2',
            });

            const state = useStore.getState();
            expect(state.connections).toHaveLength(1);
            const conn = state.connections[0];
            expect(conn.sourceNodeId).toBe('node-1');
            expect(conn.id).toMatch(/^conn-/);
            expect(conn.props!.path).toBeDefined();
            expect((conn.props!.path as any).kind).toBe('polyline');
        });

        it('should remove connection', () => {
            useStore.getState().addConnection({
                sourceNodeId: 'node-1',
                targetNodeId: 'node-2',
            });
            const connId = useStore.getState().connections[0]?.id as string;

            useStore.getState().removeConnection(connId);
            expect(useStore.getState().connections).toHaveLength(0);
        });
    });

    describe('DataSource Management', () => {
        it('should update datasource data and status', () => {
            useStore.getState().updateDataSourceData('ds-1', { temp: 25 });
            const state = useStore.getState();

            expect(state.dataSources['ds-1']?.data).toEqual({ temp: 25 });
            expect(state.dataSources['ds-1']?.status).toBe('connected');
        });

        it('should set datasource state partially', () => {
            useStore.getState().setDataSourceState('ds-2', { status: 'error', error: 'timeout' });
            expect(useStore.getState().dataSources['ds-2']?.status).toBe('error');
            expect(useStore.getState().dataSources['ds-2']?.error).toBe('timeout');
        });

        it('should remove datasource', () => {
            useStore.getState().updateDataSourceData('ds-1', { temp: 25 });
            useStore.getState().removeDataSourceFromStore('ds-1');
            expect(useStore.getState().dataSources['ds-1']).toBeUndefined();
        });
    });

    describe('Layer and Group Management', () => {
        beforeEach(() => {
            useStore.getState().addNodes([
                { id: 'node-1', type: 'test' } as any,
                { id: 'node-2', type: 'test' } as any,
                { id: 'node-3', type: 'test' } as any,
            ]);
        });

        it('should bring node to front', () => {
            useStore.getState().bringToFront(['node-1']);
            const state = useStore.getState();
            expect(state.layerOrder[state.layerOrder.length - 1]).toBe('node-1');
        });

        it('should send node to back', () => {
            useStore.getState().sendToBack(['node-3']);
            const state = useStore.getState();
            expect(state.layerOrder[0]).toBe('node-3');
        });

        it('should reorder layers by specific index', () => {
            useStore.getState().reorderLayers('node-1', 2);
            expect(useStore.getState().layerOrder).toEqual(['node-2', 'node-3', 'node-1']);
        });

        it('should create and manage groups', () => {
            const groupId = useStore.getState().createGroup(['node-1', 'node-2'], 'My Group');
            let state = useStore.getState();

            expect(state.layerGroups[groupId]).toBeDefined();
            expect(state.layerGroups[groupId].name).toBe('My Group');
            expect(state.layerGroups[groupId].memberIds).toEqual(['node-1', 'node-2']);

            useStore.getState().toggleGroupExpanded(groupId);
            expect(useStore.getState().layerGroups[groupId].expanded).toBe(false);

            useStore.getState().setGroupVisible(groupId, false);
            expect(useStore.getState().nodesById['node-1'].visible).toBe(false);

            useStore.getState().setGroupLocked(groupId, true);
            expect(useStore.getState().nodesById['node-2'].locked).toBe(true);

            useStore.getState().renameGroup(groupId, 'Renamed');
            expect(useStore.getState().layerGroups[groupId].name).toBe('Renamed');

            useStore.getState().ungroup(groupId);
            expect(useStore.getState().layerGroups[groupId]).toBeUndefined();
        });
    });

    describe('Grid Actions', () => {
        beforeEach(() => {
            // Set to grid mode
            const mockPage = {
                config: { mode: 'grid', width: 800, height: 600 },
                nodes: [
                    { id: 'node-1', type: 'test', grid: { x: 0, y: 0, w: 2, h: 2 } }
                ],
            } as any;
            useStore.getState().loadPage(mockPage);
        });

        it('should set grid settings', () => {
            useStore.getState().setGridSettings({ cols: 12, gap: 5 });
            const state = useStore.getState();
            expect(state.gridState.settings!.cols).toBe(12);
            expect(state.gridState.settings!.gap).toBe(5);
            expect(state.gridState.effectiveCols).toBe(12);
        });

        it('should move grid item', () => {
            useStore.getState().setGridSettings({ cols: 12, gap: 5 });
            useStore.getState().moveGridItem('node-1', { x: 5, y: 5 });
            const state = useStore.getState();
            const node = state.nodesById['node-1'].schemaRef as any;
            expect(node.grid.x).toBe(5);
            expect(node.grid.y).toBe(0); // Compaction gravity pulls it to the top
        });

        it('should resize grid item', () => {
            useStore.getState().setGridSettings({ cols: 12, gap: 5 });
            useStore.getState().resizeGridItem('node-1', { w: 4, h: 4 });
            const state = useStore.getState();
            const node = state.nodesById['node-1'].schemaRef as any;
            expect(node.grid.w).toBe(4);
            expect(node.grid.h).toBe(4);
        });

        it('should compact grid', () => {
            useStore.getState().setGridSettings({ cols: 12, gap: 5 });
            // Move item to an impossible hovering pos, then compact
            useStore.getState().moveGridItem('node-1', { x: 2, y: 10 });
            useStore.getState().compactGrid();
            const state = useStore.getState();
            const node = state.nodesById['node-1'].schemaRef as any;
            // Gravity should pull it up to y=0
            expect(node.grid.y).toBe(0);
        });

        it('should set grid preview', () => {
            const preview = {
                previewItems: [],
                isValid: true,
                affectedIds: ['node-1']
            };
            useStore.getState().setGridPreview(preview as any);
            expect(useStore.getState().gridState.preview as any).toEqual(preview);
        });

        it('should update grid container width and recalculate cols', () => {
            useStore.getState().setGridSettings({
                cols: 24, gap: 10, breakpoints: [{ minWidth: 500, cols: 12, rowHeight: 20 }]
            } as any);

            // Decrease width below breakpoint
            useStore.getState().updateGridContainerWidth(400);
            const state = useStore.getState();
            expect(state.gridState.effectiveCols).toBe(12);
        });
    });

    describe('Variable Management', () => {
        it('should set variable definitions and init values', () => {
            const defs = [
                { name: 'theme', type: 'string', defaultValue: 'dark' }
            ] as any[];

            useStore.getState().setVariableDefinitions(defs);
            expect(useStore.getState().variableDefinitions).toHaveLength(1);

            useStore.getState().initVariablesFromDefinitions(defs);
            expect(useStore.getState().variableValues['theme']).toBe('dark');
        });

        it('should update variable value', () => {
            const defs = [{ name: 'theme', type: 'string', defaultValue: 'dark' }] as any[];
            useStore.getState().setVariableDefinitions(defs);
            useStore.getState().initVariablesFromDefinitions(defs);

            useStore.getState().setVariableValue('theme', 'light');
            expect(useStore.getState().variableValues['theme']).toBe('light');
        });
    });
});
