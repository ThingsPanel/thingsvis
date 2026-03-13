/**
 * Unit tests for GridStackCanvas drop-coordinate conversion logic.
 *
 * Bug history:
 *   - BUGFIX: Y-axis row computation was dividing relY by `rowHeight` (unscaled grid px)
 *     instead of `rowHeight * zoom` (viewport px per row). When zoom < 1, this caused
 *     dropped widgets to land at row 0 or be off by one or more rows.
 *
 * These tests are pure-function tests — they extract the exact math used in handleDrop
 * so they can run without DOM / GridStack / React.
 */

describe('GridStackCanvas — drop coordinate → grid unit conversion', () => {
    // Pure helpers mirroring the logic inside handleDrop
    function computeGridX(relX: number, rectWidth: number, cols: number): number {
        const cellWidth = rectWidth / cols;
        return Math.max(0, Math.min(cols - 4, Math.floor(relX / cellWidth)));
    }

    function computeGridY(relY: number, rowHeight: number, zoom: number): number {
        return Math.max(0, Math.floor(relY / (rowHeight * zoom)));
    }

    const COLS = 24;
    const ROW_HEIGHT = 50; // grid px per row (unscaled)
    // Simulate a canvas that is 1200px wide at zoom=1 → scaled width = 1200 * zoom
    const CANVAS_WIDTH = 1200;

    // Helpers for typed readability
    function scaledWidth(zoom: number) {
        return CANVAS_WIDTH * zoom;
    }

    // ── X axis (already correct in original code — width comes from BoundingClientRect
    //    which accounts for transform, so cellWidth is always in viewport pixels) ──────

    describe('X axis', () => {
        it('maps drop at leftmost pixel to col 0 at zoom=1', () => {
            expect(computeGridX(0, scaledWidth(1), COLS)).toBe(0);
        });

        it('maps drop at center (600px) to col 12 at zoom=1', () => {
            expect(computeGridX(600, scaledWidth(1), COLS)).toBe(12);
        });

        it('maps drop at center visually (600px screen) to col 12 at zoom=0.8', () => {
            // At 80% zoom the canvas is 960px wide on screen; 600px → col 15
            expect(computeGridX(600, scaledWidth(0.8), COLS)).toBe(15);
        });

        it('clamps result to cols - 4 so new widget (w=4) fits', () => {
            expect(computeGridX(9999, scaledWidth(1), COLS)).toBe(COLS - 4); // 20
        });
    });

    // ── Y axis — THIS is where the bug was ───────────────────────────────────────────

    describe('Y axis — zoom=1 (no scale)', () => {
        it('row 0: drop at 0px', () => {
            expect(computeGridY(0, ROW_HEIGHT, 1)).toBe(0);
        });

        it('row 0: drop at 49px (just before next row)', () => {
            expect(computeGridY(49, ROW_HEIGHT, 1)).toBe(0);
        });

        it('row 1: drop at 50px (first pixel of row 1)', () => {
            expect(computeGridY(50, ROW_HEIGHT, 1)).toBe(1);
        });

        it('row 2: drop at 100px', () => {
            expect(computeGridY(100, ROW_HEIGHT, 1)).toBe(2);
        });

        it('row 5: drop at 250px', () => {
            expect(computeGridY(250, ROW_HEIGHT, 1)).toBe(5);
        });
    });

    describe('Y axis — zoom=0.8 (80% canvas, common editor default)', () => {
        // At zoom=0.8 each visual row is 50*0.8 = 40px tall on screen.
        // The original buggy code divided by rowHeight=50, causing wrong results.

        it('row 0: drop at 0px remains row 0', () => {
            expect(computeGridY(0, ROW_HEIGHT, 0.8)).toBe(0);
        });

        it('row 0: drop at 39px (end of first visual row)', () => {
            expect(computeGridY(39, ROW_HEIGHT, 0.8)).toBe(0);
        });

        it('row 1: drop at 40px (first visual pixel of row 1)', () => {
            // Buggy code: floor(40/50)=0 → WRONG (was row 0)
            // Fixed code: floor(40/(50*0.8))=floor(40/40)=1 → CORRECT
            expect(computeGridY(40, ROW_HEIGHT, 0.8)).toBe(1);
        });

        it('row 2: drop at 80px', () => {
            expect(computeGridY(80, ROW_HEIGHT, 0.8)).toBe(2);
        });

        it('row 3: drop at 120px', () => {
            expect(computeGridY(120, ROW_HEIGHT, 0.8)).toBe(3);
        });

        it('row 10: drop at 400px', () => {
            expect(computeGridY(400, ROW_HEIGHT, 0.8)).toBe(10);
        });
    });

    describe('Y axis — zoom=0.5 (50%)', () => {
        // Each visual row is 50*0.5=25px.
        // The old code would map the whole 0-49px range to row 0!

        it('row 0: 0-24px all stay at row 0', () => {
            for (let y = 0; y < 25; y++) {
                expect(computeGridY(y, ROW_HEIGHT, 0.5)).toBe(0);
            }
        });

        it('row 1: starts at 25px', () => {
            expect(computeGridY(25, ROW_HEIGHT, 0.5)).toBe(1);
        });

        it('row 2: starts at 50px', () => {
            expect(computeGridY(50, ROW_HEIGHT, 0.5)).toBe(2);
        });

        it('row 4: at 100px', () => {
            expect(computeGridY(100, ROW_HEIGHT, 0.5)).toBe(4);
        });
    });

    describe('Y axis — zoom=1.5 (150%, zoomed-in)', () => {
        // Each visual row is 50*1.5=75px.

        it('row 0: drop at 74px', () => {
            expect(computeGridY(74, ROW_HEIGHT, 1.5)).toBe(0);
        });

        it('row 1: starts at 75px', () => {
            expect(computeGridY(75, ROW_HEIGHT, 1.5)).toBe(1);
        });

        it('row 2: starts at 150px', () => {
            expect(computeGridY(150, ROW_HEIGHT, 1.5)).toBe(2);
        });
    });

    describe('Y axis — clamps to 0 for negative relY', () => {
        it('negative relY is clamped to row 0', () => {
            expect(computeGridY(-10, ROW_HEIGHT, 1)).toBe(0);
        });
    });
});
