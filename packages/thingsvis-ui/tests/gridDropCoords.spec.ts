import { describe, expect, it } from 'vitest';
import { clientPointToGrid } from '../src/utils/grid-mapper';

describe('GridCanvas drop coordinate to grid conversion', () => {
    const baseInput = {
        canvasRect: { left: 120, top: 80 },
        colWidth: 40,
        cols: 24,
        rowHeight: 50,
        gap: 10,
        itemWidth: 4,
    } as const;

    it('maps X using zoomed cell width', () => {
        const result = clientPointToGrid({
            ...baseInput,
            clientX: 160,
            clientY: 80,
            zoom: 0.8,
        });

        expect(result.x).toBe(1);
    });

    it('maps Y using row height plus gap', () => {
        const result = clientPointToGrid({
            ...baseInput,
            clientX: 120,
            clientY: 128,
            zoom: 0.8,
        });

        expect(result.y).toBe(1);
    });

    it('accounts for shifted canvas origin from centering or pan', () => {
        const result = clientPointToGrid({
            ...baseInput,
            clientX: 240,
            clientY: 200,
            zoom: 1,
        });

        expect(result).toEqual({ x: 2, y: 2 });
    });

    it('clamps X so a default width-4 widget still fits', () => {
        const result = clientPointToGrid({
            ...baseInput,
            clientX: 5000,
            clientY: 80,
            zoom: 1,
        });

        expect(result.x).toBe(20);
    });

    it('clamps negative coordinates to row and col 0', () => {
        const result = clientPointToGrid({
            ...baseInput,
            clientX: 0,
            clientY: 0,
            zoom: 1,
        });

        expect(result).toEqual({ x: 0, y: 0 });
    });
});
