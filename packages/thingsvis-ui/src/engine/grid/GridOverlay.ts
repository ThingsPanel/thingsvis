import { Line, Group } from 'leafer-ui';
import type { GridSettings } from '@thingsvis/schema';
import { calculateColWidth } from '../../utils/grid-mapper';

/**
 * GridOverlay - Renders background grid lines for the grid layout mode
 *
 * Creates a visual helper showing column and row boundaries in the Leafer canvas.
 * Grid lines are rendered as dashed lines with a subtle color.
 * Used exclusively by VisualEngine for the fixed/infinite canvas Leafer layer.
 */
export interface GridOverlayOptions {
    /** Grid settings */
    settings: GridSettings;
    /** Container width in pixels */
    containerWidth: number;
    /** Container height in pixels */
    containerHeight: number;
    /** Grid line color (default: #e0e0e0) */
    lineColor?: string;
    /** Grid line width (default: 1) */
    lineWidth?: number;
    /** Dash pattern (default: [4, 4]) */
    dashPattern?: number[];
    /** Whether to show grid lines */
    visible?: boolean;
}

/**
 * Creates a Leafer Group containing all grid lines
 */
export function createGridOverlay(options: GridOverlayOptions): Group {
    const {
        settings,
        containerWidth,
        containerHeight,
        lineColor = '#e0e0e0',
        lineWidth = 1,
        dashPattern = [4, 4],
        visible = true,
    } = options;

    const group = new Group();

    if (!visible || !settings.showGridLines) {
        return group;
    }

    const { cols, rowHeight, gap } = settings;
    const colWidth = calculateColWidth(settings, containerWidth);
    const cellWidth = colWidth + gap;
    const cellHeight = rowHeight + gap;

    // Calculate number of rows needed
    const rowCount = Math.ceil(containerHeight / cellHeight) + 1;

    // Create vertical lines (column separators)
    for (let i = 0; i <= cols; i++) {
        const x = i * cellWidth - gap / 2;
        const line = new Line({
            points: [x, 0, x, containerHeight],
            stroke: lineColor,
            strokeWidth: lineWidth,
            dashPattern,
        });
        group.add(line);
    }

    // Create horizontal lines (row separators)
    for (let j = 0; j <= rowCount; j++) {
        const y = j * cellHeight - gap / 2;
        const line = new Line({
            points: [0, y, containerWidth, y],
            stroke: lineColor,
            strokeWidth: lineWidth,
            dashPattern,
        });
        group.add(line);
    }

    return group;
}

/**
 * Updates an existing grid overlay with new settings
 */
export function updateGridOverlay(group: Group, options: GridOverlayOptions): void {
    group.removeAll();
    const newGroup = createGridOverlay(options);
    while (newGroup.children.length > 0) {
        const child = newGroup.children[0];
        if (child) {
            newGroup.remove(child);
            group.add(child);
        } else {
            break;
        }
    }
}

/**
 * GridOverlay class for object-oriented usage within VisualEngine
 */
export class GridOverlay {
    private group: Group;
    private options: GridOverlayOptions | null = null;

    constructor(options?: GridOverlayOptions) {
        this.group = new Group();
        if (options) {
            this.options = options;
            this.update(options);
        }
    }

    getGroup(): Group {
        return this.group;
    }

    update(options: Partial<GridOverlayOptions> & { settings?: GridSettings; containerWidth?: number; containerHeight?: number }): void {
        if (this.options) {
            this.options = { ...this.options, ...options };
        } else if (options.settings && options.containerWidth !== undefined && options.containerHeight !== undefined) {
            this.options = options as GridOverlayOptions;
        } else {
            return;
        }
        updateGridOverlay(this.group, this.options);
    }

    setVisible(visible: boolean): void {
        if (this.options) {
            this.options.visible = visible;
            this.update({ visible });
        } else {
            this.group.visible = visible;
        }
    }

    dispose(): void {
        this.group.removeAll();
    }
}
