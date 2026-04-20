import { useCallback } from 'react';
import { loadWidget } from '../lib/registry/componentLoader';
import { resolveInitialWidgetProps } from '../lib/registry/resolveInitialWidgetProps';
import { dataSourceManager, store } from '../lib/store';
import type { NodeSchemaType } from '@thingsvis/schema';
import { augmentPlatformDataSourcesForNodes } from '../lib/platformDatasourceBindings';

export function resolveInitialNodeSize(entry: {
  defaultSize?: { width?: number; height?: number };
  resizable?: boolean;
  constraints?: Record<string, unknown>;
}): { width: number; height: number } | undefined {
  if (entry.resizable === false) {
    return undefined;
  }

  const fallback = { width: 200, height: 100 };
  const size = {
    width: Number(entry.defaultSize?.width ?? fallback.width),
    height: Number(entry.defaultSize?.height ?? fallback.height),
  };

  const constraints = entry.constraints ?? {};
  const minWidth = Number(constraints.minWidth);
  const minHeight = Number(constraints.minHeight);
  const maxWidth = Number(constraints.maxWidth);
  const maxHeight = Number(constraints.maxHeight);

  if (Number.isFinite(minWidth)) size.width = Math.max(size.width, minWidth);
  if (Number.isFinite(minHeight)) size.height = Math.max(size.height, minHeight);
  if (Number.isFinite(maxWidth)) size.width = Math.min(size.width, maxWidth);
  if (Number.isFinite(maxHeight)) size.height = Math.min(size.height, maxHeight);

  return size;
}

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
          previewDefaults: entry.previewDefaults,
          sampleData: entry.sampleData,
          fallbackDefaults: (entry as { defaultProps?: Record<string, unknown> }).defaultProps,
        });
        const initialSize = resolveInitialNodeSize(
          entry as Record<string, unknown> & {
            defaultSize?: { width?: number; height?: number };
            resizable?: boolean;
            constraints?: Record<string, unknown>;
          },
        );
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
          ...(initialSize ? { size: initialSize } : {}),
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
          previewDefaults: entry.previewDefaults,
          sampleData: entry.sampleData,
          fallbackDefaults: (entry as { defaultProps?: Record<string, unknown> }).defaultProps,
        });
        const initialSize = resolveInitialNodeSize(
          entry as Record<string, unknown> & {
            defaultSize?: { width?: number; height?: number };
            resizable?: boolean;
            constraints?: Record<string, unknown>;
          },
        );
        const now = Date.now();
        const node: NodeSchemaType = {
          id: `node-${componentType}-${now}`,
          type: componentType,
          position: { x: 0, y: 0 },
          ...(initialSize ? { size: initialSize } : {}),
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
