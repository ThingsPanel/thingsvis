/**
 * Unit tests: updateNode props reactivity
 *
 * Critical business flow: When a user changes a widget property (fontSize, color, etc.)
 * via the right-side PropsPanel, updateNode() must:
 *   1. Create a NEW state reference (triggering Zustand subscribers)
 *   2. Correctly merge the new prop value into schemaRef.props
 *   3. NOT disturb unrelated props or other node fields
 *
 * This covers the part of the pipeline BEFORE VisualEngine / GridStackCanvas.
 * The original bug: 'props' update was correct in the store but the GridStackCanvas
 * nodeSchemaKey only watched `data`, not `props`, so the overlay never re-rendered.
 * These tests guard the store side of that contract.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createKernelStore } from '../src/store/KernelStore';

describe('updateNode — props reactivity', () => {
    let store: ReturnType<typeof createKernelStore>;

    beforeEach(() => {
        store = createKernelStore();
        store.getState().addNodes([
            {
                id: 'widget-1',
                type: 'basic/text',
                position: { x: 0, y: 0 },
                size: { width: 200, height: 60 },
                props: { fontSize: 14, color: '#000000', content: 'Hello' },
            } as any,
        ]);
    });

    // ── Correctness ────────────────────────────────────────────────────────────

    it('merges new prop value without losing existing props', () => {
        store.getState().updateNode('widget-1', { props: { fontSize: 24 } });
        const schema = store.getState().nodesById['widget-1'].schemaRef as any;

        expect(schema.props.fontSize).toBe(24);       // updated
        expect(schema.props.color).toBe('#000000');    // preserved
        expect(schema.props.content).toBe('Hello');    // preserved
    });

    it('updates multiple props in one call', () => {
        store.getState().updateNode('widget-1', {
            props: { fontSize: 20, color: '#ff0000' },
        });
        const schema = store.getState().nodesById['widget-1'].schemaRef as any;

        expect(schema.props.fontSize).toBe(20);
        expect(schema.props.color).toBe('#ff0000');
        expect(schema.props.content).toBe('Hello'); // unchanged
    });

    it('adds a brand-new prop key that did not exist before', () => {
        store.getState().updateNode('widget-1', { props: { opacity: 0.5 } });
        const schema = store.getState().nodesById['widget-1'].schemaRef as any;

        expect(schema.props.opacity).toBe(0.5);
        expect(schema.props.fontSize).toBe(14); // pre-existing props untouched
    });

    it('does nothing when node id does not exist', () => {
        const before = store.getState().nodesById;
        store.getState().updateNode('nonexistent', { props: { fontSize: 99 } });
        expect(store.getState().nodesById).toBe(before); // same reference = no mutation
    });

    // ── Zustand reference semantics (critical for useSyncExternalStore) ────────

    it('produces a new nodesById reference after prop update', () => {
        const before = store.getState().nodesById;
        store.getState().updateNode('widget-1', { props: { fontSize: 24 } });
        const after = store.getState().nodesById;

        // Zustand + Immer must produce a new object reference so subscribers re-render
        expect(after).not.toBe(before);
    });

    it('produces a new schemaRef reference for the updated node', () => {
        const nodeBefore = store.getState().nodesById['widget-1'];
        store.getState().updateNode('widget-1', { props: { fontSize: 24 } });
        const nodeAfter = store.getState().nodesById['widget-1'];

        expect(nodeAfter.schemaRef).not.toBe(nodeBefore.schemaRef);
    });

    it('does NOT change the schemaRef reference of unrelated nodes', () => {
        store.getState().addNodes([
            { id: 'widget-2', type: 'basic/rect', props: { fill: 'blue' } } as any,
        ]);

        const node2Before = store.getState().nodesById['widget-2'];
        store.getState().updateNode('widget-1', { props: { fontSize: 99 } });
        const node2After = store.getState().nodesById['widget-2'];

        // Structural sharing: unrelated node ref should be unchanged
        expect(node2After).toBe(node2Before);
    });

    // ── nodeSchemaKey derivation (guards the GridStackCanvas overlay update) ───

    describe('nodeSchemaKey derivation (GridStackCanvas overlay trigger)', () => {
        // This mirrors the exact logic in GridStackCanvas that was buggy:
        //   OLD: key = id + JSON.stringify(data)    ← missed props changes
        //   NEW: key = id + JSON.stringify(props) + JSON.stringify(data)
        function computeNodeSchemaKey(nodes: any[]): string {
            return nodes.map((n: any) => {
                const s = n.schemaRef as any;
                return `${n.id}:${JSON.stringify(s?.props ?? {})}|${JSON.stringify(s?.data ?? [])}`;
            }).join('||');
        }

        it('key changes when a prop value changes', () => {
            const nodesBefore = Object.values(store.getState().nodesById);
            const keyBefore = computeNodeSchemaKey(nodesBefore);

            store.getState().updateNode('widget-1', { props: { fontSize: 99 } });

            const nodesAfter = Object.values(store.getState().nodesById);
            const keyAfter = computeNodeSchemaKey(nodesAfter);

            expect(keyAfter).not.toBe(keyBefore); // change detected → overlay will update
        });

        it('key changes when data binding changes', () => {
            const nodesBefore = Object.values(store.getState().nodesById);
            const keyBefore = computeNodeSchemaKey(nodesBefore);

            store.getState().updateNode('widget-1', {
                data: [{ targetProp: 'content', expression: '{{ ds.sensor.data.value }}' }],
            });

            const nodesAfter = Object.values(store.getState().nodesById);
            const keyAfter = computeNodeSchemaKey(nodesAfter);

            expect(keyAfter).not.toBe(keyBefore);
        });

        it('OLD key (only data) would NOT change when only props change — proving the bug', () => {
            function buggyNodeSchemaKey(nodes: any[]): string {
                return nodes.map((n: any) => {
                    const s = n.schemaRef as any;
                    return `${n.id}:${JSON.stringify(s?.data ?? [])}`; // ← original buggy logic
                }).join('|');
            }

            const nodesBefore = Object.values(store.getState().nodesById);
            const keyBefore = buggyNodeSchemaKey(nodesBefore);

            store.getState().updateNode('widget-1', { props: { fontSize: 99 } });

            const nodesAfter = Object.values(store.getState().nodesById);
            const keyAfter = buggyNodeSchemaKey(nodesAfter);

            // This demonstrates the bug: old key stays the same even though fontSize changed
            expect(keyAfter).toBe(keyBefore); // ← BUG: overlay would NOT update!
        });
    });

    // ── Data source interaction ────────────────────────────────────────────────

    describe('data source state updates', () => {
        it('dataSources reference changes when DS data updates', () => {
            const before = store.getState().dataSources;

            store.getState().updateDataSourceData('sensor', { temperature: 25 });

            const after = store.getState().dataSources;

            expect(after).not.toBe(before); // new reference → GridStackCanvas useEffect triggers
            expect(after['sensor'].data).toEqual({ temperature: 25 });
        });

        it('dataSources reference changes when DS status changes', () => {
            store.getState().setDataSourceState('api', { status: 'loading' });
            const ref1 = store.getState().dataSources;

            store.getState().setDataSourceState('api', { status: 'connected' });
            const ref2 = store.getState().dataSources;

            expect(ref2).not.toBe(ref1);
        });
    });
});
