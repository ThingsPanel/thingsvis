import { useCallback } from 'react';
import { dataSourceManager } from '@thingsvis/kernel';
import { loadWidget } from '../lib/registry/componentLoader';
import { resolveInitialWidgetProps } from '../lib/registry/resolveInitialWidgetProps';
import { store } from '../lib/store';
import type { NodeSchemaType } from '@thingsvis/schema';
import { augmentPlatformDataSourcesForNodes } from '../lib/platformDatasourceBindings';

export function useEditorDragDrop(markDirty: () => void) {
  const hydratePlatformDataSourcesForNodes = useCallback(async (nodes: NodeSchemaType[]) => {
    const currentConfigs = dataSourceManager.getAllConfigs();
    const nextConfigs = augmentPlatformDataSourcesForNodes(
      currentConfigs,
      nodes as Array<Record<string, unknown>>,
    );

    for (const nextConfig of nextConfigs) {
      const prevConfig = currentConfigs.find((config) => config.id === nextConfig.id);
      if (prevConfig && JSON.stringify(prevConfig) === JSON.stringify(nextConfig)) {
        continue;
      }

      await dataSourceManager.registerDataSource(nextConfig, false);
    }
  }, []);

  const handleAddNode = useCallback(
    async (componentType: string) => {
      try {
        const { entry } = await loadWidget(componentType);
        const defaultProps = resolveInitialWidgetProps({
          schema: entry.schema,
          standaloneDefaults: entry.standaloneDefaults,
          fallbackDefaults: (entry as { defaultProps?: Record<string, unknown> }).defaultProps,
        });
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
        const defaultProps = resolveInitialWidgetProps({
          schema: entry.schema,
          standaloneDefaults: entry.standaloneDefaults,
          fallbackDefaults: (entry as { defaultProps?: Record<string, unknown> }).defaultProps,
        });
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
        hydratePlatformDataSourcesForNodes([node]).catch((error) => {
          console.error(
            '[EditorDragDrop] Failed to hydrate platform data sources for snippet:',
            error,
          );
        });
        markDirty();
      } catch (e) {
        console.error('[EditorDragDrop] onDropSnippet failed:', e);
      }
    },
    [hydratePlatformDataSourcesForNodes, markDirty],
  );

  return { handleAddNode, onDropComponent, onDropSnippet };
}
