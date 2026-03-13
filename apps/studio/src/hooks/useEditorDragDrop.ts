import { useCallback } from 'react';
import { loadWidget } from '../lib/registry/componentLoader';
import { extractDefaults } from '../lib/registry/schemaUtils';
import { store } from '../lib/store';
import type { NodeSchemaType } from '@thingsvis/schema';

export function useEditorDragDrop(markDirty: () => void) {
  const handleAddNode = useCallback(
    async (componentType: string) => {
      try {
        const { entry } = await loadWidget(componentType);
        const defaultProps = extractDefaults(entry.schema);
        const now = Date.now();

        // Calculate grid position for new widget
        const existingNodes = Object.values(store.getState().nodesById);
        let gridY = 0;
        existingNodes.forEach((n: any) => {
          const g = n.schemaRef?.grid;
          if (g) {
            gridY = Math.max(gridY, (g.y ?? 0) + (g.h ?? 2));
          }
        });

        const node: NodeSchemaType = {
          id: `node-${componentType}-${now}`,
          type: componentType,
          position: { x: 100, y: 100 },
          size: { width: 200, height: 80 },
          props: defaultProps,
          grid: { x: 0, y: gridY, w: 4, h: 3, static: false, isDraggable: true, isResizable: true },
        };
        store.getState().addNodes([node]);
        markDirty();
      } catch (e) {
        console.error('[EditorDragDrop] handleAddNode failed:', e);
      }
    },
    [markDirty],
  );

  const onDropComponent = useCallback(
    async (componentType: string, gridPosition: any) => {
      try {
        const { entry } = await loadWidget(componentType);
        const defaultProps = extractDefaults(entry.schema);
        const now = Date.now();
        const node: NodeSchemaType = {
          id: `node-${componentType}-${now}`,
          type: componentType,
          position: { x: 0, y: 0 },
          props: defaultProps,
          grid: {
            x: gridPosition.x,
            y: gridPosition.y,
            w: gridPosition.w ?? 4,
            h: gridPosition.h ?? 3,
            static: false,
            isDraggable: true,
            isResizable: true,
          },
        };
        store.getState().addNodes([node]);
        markDirty();
      } catch (e) {
        console.error('[EditorDragDrop] onDropComponent failed:', e);
      }
    },
    [markDirty],
  );
  const onDropSnippet = useCallback(
    (widgetSnippetJson: string, gridPosition: any) => {
      try {
        const snippet = JSON.parse(widgetSnippetJson);
        const now = Date.now();

        // Use the snippet type and props/data, but override the ID and position
        const node: NodeSchemaType = {
          ...snippet,
          id: `node-${snippet.type}-${now}`,
          position: { x: 0, y: 0 },
          grid: {
            x: gridPosition.x,
            y: gridPosition.y,
            w: snippet.grid?.w ?? gridPosition.w ?? 4,
            h: snippet.grid?.h ?? gridPosition.h ?? 3,
            static: false,
            isDraggable: true,
            isResizable: true,
          },
        };

        store.getState().addNodes([node]);
        markDirty();
      } catch (e) {
        console.error('[EditorDragDrop] onDropSnippet failed:', e);
      }
    },
    [markDirty],
  );

  return { handleAddNode, onDropComponent, onDropSnippet };
}
