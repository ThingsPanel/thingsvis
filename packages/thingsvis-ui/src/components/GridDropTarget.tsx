import React, { useMemo } from 'react';
import type { GridSettings, GridPosition } from '@thingsvis/schema';
import { gridToPixel } from '../utils/grid-mapper';

/** Subset of KernelState['gridState']['preview'] */
export interface GridPreviewState {
    active: boolean;
    itemId: string | null;
    targetPosition: GridPosition | null;
    affectedItems: string[];
}

export interface GridDropTargetProps {
    /** Current preview state from store.gridState.preview */
    preview: GridPreviewState;
    /** Grid settings for coordinate conversion */
    settings: GridSettings;
    /** Container width used for pixel rect calculation */
    containerWidth: number;
}

/**
 * GridDropTarget
 *
 * Renders an animated placeholder rectangle during drag/resize operations.
 * Pixel rect is derived from `preview.targetPosition` via `gridToPixel()`.
 * Replaces the Leafer-based GridPlaceholder.
 */
export const GridDropTarget: React.FC<GridDropTargetProps> = ({
    preview,
    settings,
    containerWidth,
}) => {
    const pixelRect = useMemo(() => {
        if (!preview.active || !preview.targetPosition) return null;
        return gridToPixel(preview.targetPosition, settings, containerWidth);
    }, [preview, settings, containerWidth]);

    if (!pixelRect) return null;

    return (
        <div
            aria-hidden="true"
            style={{
                position: 'absolute',
                left: pixelRect.x,
                top: pixelRect.y,
                width: pixelRect.width,
                height: pixelRect.height,
                // Use outline (not border) so the outer edge is inset 1px — matching GridNodeItem's
                // outlineOffset: -1 convention. This keeps the visual boundary pixel-aligned.
                outline: '2px dashed rgba(0, 120, 212, 0.9)',
                outlineOffset: -1,
                backgroundColor: 'rgba(0, 120, 212, 0.15)',
                borderRadius: 4,
                pointerEvents: 'none',
                zIndex: 9999,
                transition: 'left 80ms ease-out, top 80ms ease-out, width 80ms ease-out, height 80ms ease-out',
                boxSizing: 'border-box',
            }}
        />
    );
};

export default GridDropTarget;
