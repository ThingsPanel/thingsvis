import { vi } from 'vitest';

export class CanvasRenderingContext2D {
    rect() { }
    fill() { }
    stroke() { }
}

export class HTMLCanvasElement {
    getContext() {
        return new CanvasRenderingContext2D();
    }
}

export class Path2D { }

vi.stubGlobal('CanvasRenderingContext2D', CanvasRenderingContext2D);
vi.stubGlobal('HTMLCanvasElement', HTMLCanvasElement);
vi.stubGlobal('Path2D', Path2D);
