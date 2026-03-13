import type { KernelStore, KernelState, GridState } from '@thingsvis/kernel';
import { Group } from 'leafer-ui';
import type { GridSettings } from '@thingsvis/schema';
import { GridOverlay } from '../grid/GridOverlay';
import { GridPlaceholder } from '../grid/GridPlaceholder';
import { gridToPixel } from '../../utils/grid-mapper';

export class GridManager {
    private gridRoot?: Group;
    private gridOverlay?: GridOverlay;
    private gridPlaceholder?: GridPlaceholder;
    private lastGridSettings?: GridSettings;
    private lastGridPreview?: GridState['preview'];
    private resizeObserver?: ResizeObserver;
    private lastContainerWidth?: number;

    constructor(
        private store: KernelStore,
        private containerEl: HTMLElement | undefined,
        private rootGroup: Group
    ) { }

    mount() {
        this.gridRoot = new Group();
        this.rootGroup.addAt(this.gridRoot, 0); // Put at back
        this.setupResizeObserver();
    }

    unmount() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = undefined;
        }
        this.lastContainerWidth = undefined;

        this.gridOverlay?.dispose();
        this.gridOverlay = undefined;
        this.gridPlaceholder?.dispose();
        this.gridPlaceholder = undefined;
        this.gridRoot = undefined;
        this.lastGridSettings = undefined;
        this.lastGridPreview = undefined;
    }

    private setupResizeObserver() {
        if (!this.containerEl) return;
        this.lastContainerWidth = this.containerEl.clientWidth;

        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const newWidth = entry.contentRect.width;
                if (this.lastContainerWidth !== undefined && Math.abs(newWidth - this.lastContainerWidth) < 1) {
                    continue;
                }
                this.lastContainerWidth = newWidth;

                const state = this.store.getState() as KernelState;
                const storeState = state as any;
                if (state.canvas?.mode === 'grid' && storeState.updateGridContainerWidth) {
                    storeState.updateGridContainerWidth(newWidth);
                }

                this.lastGridSettings = undefined;
                this.sync(state);
            }
        });

        this.resizeObserver.observe(this.containerEl);
    }

    sync(state: KernelState) {
        if (!this.gridRoot || !this.containerEl) return;

        const gridState = state.gridState;
        const isGridMode = state.canvas?.mode === 'grid';

        if (!isGridMode) {
            this.gridOverlay?.setVisible(false);
            this.gridPlaceholder?.hide();
            return;
        }

        const settings = gridState?.settings;
        if (!settings) return;

        const containerWidth = this.containerEl.clientWidth;
        const containerHeight = this.containerEl.clientHeight;

        const cols = gridState?.effectiveCols ?? settings.cols ?? 24;
        const renderSettings: GridSettings = {
            ...settings,
            cols,
        };

        if (!this.gridOverlay) {
            this.gridOverlay = new GridOverlay();
            this.gridRoot.add(this.gridOverlay.getGroup());
        }

        const settingsChanged = JSON.stringify(renderSettings) !== JSON.stringify(this.lastGridSettings);
        if (settingsChanged) {
            this.lastGridSettings = renderSettings;
            this.gridOverlay.update({
                settings: renderSettings,
                containerWidth,
                containerHeight,
                visible: true
            });
        }

        this.gridOverlay.setVisible(true);

        if (!this.gridPlaceholder) {
            this.gridPlaceholder = new GridPlaceholder();
            this.gridRoot.add(this.gridPlaceholder.getGroup());
        }

        const preview = gridState?.preview;
        const previewChanged = JSON.stringify(preview) !== JSON.stringify(this.lastGridPreview);

        if (previewChanged) {
            this.lastGridPreview = preview;

            if (preview?.active && preview.targetPosition) {
                const previewRect = gridToPixel(preview.targetPosition, renderSettings, containerWidth);
                this.gridPlaceholder.updatePosition(previewRect, true);
                this.gridPlaceholder.show();

                if (preview.affectedItems && preview.affectedItems.length > 0) {
                    const affectedNodes = preview.affectedItems
                        .map((id: string) => state.nodesById[id])
                        .filter((node: any): node is typeof node & { schemaRef: any } => !!node && !!node.schemaRef);

                    const ghostRects = affectedNodes.map((node: any) => {
                        const gridPos = node.schemaRef.grid;
                        if (!gridPos) return null;
                        return {
                            ...gridToPixel(gridPos, renderSettings, containerWidth)
                        };
                    }).filter((rect: unknown): rect is { x: number; y: number; width: number; height: number } => rect !== null);

                    this.gridPlaceholder.updateGhosts(ghostRects);
                } else {
                    this.gridPlaceholder.updateGhosts([]);
                }
            } else {
                this.gridPlaceholder.hide();
                this.gridPlaceholder.updateGhosts([]);
            }
        }
    }
}
