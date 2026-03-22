import { describe, expect, it } from 'vitest';
import {
  DRAG_COMMIT_THRESHOLD_PX,
  extractCanvasNodeIdFromTarget,
  shouldCommitCanvasDrag,
} from './canvasInteraction';

describe('canvasInteraction', () => {
  it('extracts node ids from proxy and overlay targets', () => {
    const proxy = document.createElement('div');
    proxy.dataset.nodeId = 'node-proxy';
    const proxyChild = document.createElement('span');
    proxy.appendChild(proxyChild);

    const overlay = document.createElement('div');
    overlay.dataset.overlayNodeId = 'node-overlay';
    const overlayChild = document.createElement('button');
    overlay.appendChild(overlayChild);

    expect(extractCanvasNodeIdFromTarget(proxyChild)).toBe('node-proxy');
    expect(extractCanvasNodeIdFromTarget(overlayChild)).toBe('node-overlay');
    expect(extractCanvasNodeIdFromTarget(document.createTextNode('x'))).toBeNull();
  });

  it('commits only meaningful drag deltas', () => {
    expect(shouldCommitCanvasDrag(null)).toBe(false);
    expect(shouldCommitCanvasDrag({ x: 1, y: 1 })).toBe(false);
    expect(shouldCommitCanvasDrag({ x: DRAG_COMMIT_THRESHOLD_PX, y: 0 })).toBe(true);
    expect(shouldCommitCanvasDrag({ x: 0, y: 4 })).toBe(true);
  });
});
