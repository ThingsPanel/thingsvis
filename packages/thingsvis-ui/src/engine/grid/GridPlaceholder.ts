import { Rect, Group } from 'leafer-ui';
import type { GridSettings, GridPosition } from '@thingsvis/schema';
import { gridToPixel, calculateColWidth } from '../../utils/grid-mapper';

/**
 * GridPlaceholder - Renders drag/resize placeholder for grid layout in Leafer canvas
 *
 * Shows a semi-transparent rectangle indicating where a component will land
 * during drag or resize operations. Used exclusively by VisualEngine.
 */
export interface GridPlaceholderOptions {
    settings: GridSettings;
    containerWidth: number;
    position: GridPosition;
    active?: boolean;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    animationDuration?: number;
}

export function createGridPlaceholder(options: GridPlaceholderOptions): Rect {
    const {
        settings,
        containerWidth,
        position,
        active = true,
        fillColor = 'rgba(0, 120, 212, 0.3)',
        strokeColor = 'rgba(0, 120, 212, 0.8)',
        strokeWidth = 2,
    } = options;

    const pixelRect = gridToPixel(position, settings, containerWidth);

    const rect = new Rect({
        x: pixelRect.x,
        y: pixelRect.y,
        width: pixelRect.width,
        height: pixelRect.height,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        cornerRadius: 4,
        opacity: active ? 1 : 0,
    });

    return rect;
}

export interface GhostOverlayOptions {
    settings: GridSettings;
    containerWidth: number;
    positions: Array<{ id: string; position: GridPosition }>;
    fillColor?: string;
    strokeColor?: string;
}

export function createGhostOverlays(options: GhostOverlayOptions): Group {
    const {
        settings,
        containerWidth,
        positions,
        fillColor = 'rgba(128, 128, 128, 0.2)',
        strokeColor = 'rgba(128, 128, 128, 0.5)',
    } = options;

    const group = new Group();

    for (const { position } of positions) {
        const pixelRect = gridToPixel(position, settings, containerWidth);

        const rect = new Rect({
            x: pixelRect.x,
            y: pixelRect.y,
            width: pixelRect.width,
            height: pixelRect.height,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: 1,
            cornerRadius: 4,
            dashPattern: [4, 4],
        });

        group.add(rect);
    }

    return group;
}

/**
 * GridPlaceholder class for object-oriented usage within VisualEngine
 */
export class GridPlaceholder {
    private group: Group;
    private rect: Rect;
    private ghostGroup: Group;
    private options: GridPlaceholderOptions | null = null;

    constructor(options?: GridPlaceholderOptions) {
        this.group = new Group();
        this.ghostGroup = new Group();

        this.rect = new Rect({
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            fill: 'rgba(0, 120, 212, 0.3)',
            stroke: 'rgba(0, 120, 212, 0.8)',
            strokeWidth: 2,
            cornerRadius: 4,
            opacity: 0,
        });

        this.group.add(this.rect);
        this.group.add(this.ghostGroup);

        if (options) {
            this.options = options;
            const pixelPos = gridToPixel(options.position, options.settings, options.containerWidth);
            this.updatePosition(pixelPos, false);
            if (options.active) {
                this.show();
            }
        }
    }

    getGroup(): Group {
        return this.group;
    }

    getRect(): Rect {
        return this.rect;
    }

    getGhostGroup(): Group {
        return this.ghostGroup;
    }

    updatePosition(position: { x: number; y: number; width: number; height: number }, animate: boolean = true): void {
        if (animate) {
            this.rect.set({
                animation: {
                    style: {
                        x: position.x,
                        y: position.y,
                        width: position.width,
                        height: position.height,
                    },
                    duration: 0.2,
                    easing: 'ease-out',
                },
            });
        } else {
            this.rect.set({
                x: position.x,
                y: position.y,
                width: position.width,
                height: position.height,
            });
        }
    }

    updateGhosts(rects: Array<{ x: number; y: number; width: number; height: number }>): void {
        this.ghostGroup.removeAll();

        for (const rect of rects) {
            const ghostRect = new Rect({
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                fill: 'rgba(128, 128, 128, 0.2)',
                stroke: 'rgba(128, 128, 128, 0.5)',
                strokeWidth: 1,
                cornerRadius: 4,
                dashPattern: [4, 4],
            });
            this.ghostGroup.add(ghostRect);
        }
    }

    show(): void {
        this.rect.set({ opacity: 1 });
    }

    hide(): void {
        this.rect.set({ opacity: 0 });
        this.ghostGroup.removeAll();
    }

    dispose(): void {
        this.ghostGroup.removeAll();
        this.group.removeAll();
    }
}
