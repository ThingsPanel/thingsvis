import React, { useMemo } from 'react';

/**
 * Props for the grid canvas background component.
 */
export interface GridCanvasBackgroundProps {
    /** Number of grid columns */
    cols: number;
    /** Width of each column in pixels */
    colWidth: number;
    /** Height of each row in pixels */
    rowHeight: number;
    /** Gap between cells in pixels */
    gap: number;
    /** Total canvas height in pixels (drives SVG height) */
    totalHeight: number;
    /** Total canvas width in pixels */
    containerWidth: number;
}

/**
 * GridCanvasBackground
 *
 * Renders a lightweight SVG grid line overlay behind the widget nodes.
 * Pure CSS/SVG — zero Leafer dependency.
 *
 * Column separators are drawn at the right edge of each column gap.
 * Row separators are drawn at the top edge of each row gap.
 */
export const GridCanvasBackground: React.FC<GridCanvasBackgroundProps> = ({
    cols,
    colWidth,
    rowHeight,
    gap,
    totalHeight,
    containerWidth,
}) => {
    const cellWidth = colWidth + gap;
    const cellHeight = rowHeight + gap;

    // Draw enough rows to cover totalHeight + some buffer
    const rowCount = Math.ceil((totalHeight + cellHeight) / cellHeight);

    const svgPaths = useMemo(() => {
        const pathParts: string[] = [];

        // Vertical lines — one per column separator
        for (let c = 1; c < cols; c++) {
            const x = c * cellWidth - gap / 2;
            pathParts.push(`M ${x} 0 L ${x} ${totalHeight}`);
        }

        // Horizontal lines — one per row separator
        for (let r = 1; r < rowCount; r++) {
            const y = r * cellHeight - gap / 2;
            pathParts.push(`M 0 ${y} L ${containerWidth} ${y}`);
        }

        return pathParts.join(' ');
    }, [cols, colWidth, rowHeight, gap, totalHeight, containerWidth, cellWidth, cellHeight, rowCount]);

    return (
        <svg
            aria-hidden="true"
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: totalHeight,
                pointerEvents: 'none',
                zIndex: 0,
                overflow: 'visible',
            }}
        >
            <path
                d={svgPaths}
                stroke="rgba(128,128,128,0.2)"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="none"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

export default GridCanvasBackground;
