import { afterEach, describe, expect, it } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import Main from './src/index';
import { getDefaultProps } from './src/schema';

const defaults = getDefaultProps();

function mockRect(
  element: Element | null,
  rect: { left: number; top: number; width: number; height: number },
) {
  if (!element) throw new Error('Expected element to exist');
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () =>
      ({
        x: rect.left,
        y: rect.top,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
        toJSON: () => ({}),
      }) as DOMRect,
  });
}

function parsePathPoints(d: string | null): Array<{ x: number; y: number }> {
  if (!d) return [];
  const nums = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < nums.length; i += 2) {
    const x = nums[i];
    const y = nums[i + 1];
    if (typeof x === 'number' && typeof y === 'number') {
      points.push({ x, y });
    }
  }
  return points;
}

function getWorldPathPoints(element: HTMLElement) {
  const svg = element.querySelector('svg');
  const path = element.querySelector(`path[stroke="${defaults.pipeColor}"]`);
  const points = parsePathPoints(path?.getAttribute('d') ?? null);
  const offsetX = Number.parseFloat(svg?.style.left || '0') || 0;
  const offsetY = Number.parseFloat(svg?.style.top || '0') || 0;
  return points.map((point) => ({ x: point.x + offsetX, y: point.y + offsetY }));
}

describe('industrial/pipe widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a visible pipe with the standardized defaults', () => {
    const harness = mountWidget(Main, {
      size: { width: 240, height: 80 },
    });

    const svg = harness.element.querySelector('svg');
    const visibleShape =
      harness.element.querySelector(`polyline[stroke="${defaults.pipeColor}"]`) ??
      harness.element.querySelector(`path[stroke="${defaults.pipeColor}"]`);

    expect(svg?.getAttribute('viewBox')).toBe('0 0 240 80');
    expect(visibleShape?.getAttribute('stroke-width')).toBe('12');

    harness.destroy();
  });

  it('renders the flow overlay when flow is enabled', () => {
    const harness = mountWidget(Main, {
      size: { width: 240, height: 80 },
      props: {
        flowEnabled: true,
        flowLength: 8,
        flowSpacing: 16,
      },
    });

    const strokeShapes = Array.from(
      harness.element.querySelectorAll(
        `polyline[stroke="${defaults.pipeColor}"], path[stroke="${defaults.pipeColor}"], polyline[stroke="${defaults.flowColor}"], path[stroke="${defaults.flowColor}"]`,
      ),
    );
    const flowShape =
      strokeShapes.find(
        (node) =>
          node.getAttribute('stroke') === defaults.flowColor &&
          node.getAttribute('stroke-dasharray') === '8 16',
      ) ?? null;
    const baseShape =
      strokeShapes.find(
        (node) =>
          node.getAttribute('stroke') === defaults.pipeColor &&
          node !== flowShape,
      ) ?? null;

    expect(flowShape).not.toBeNull();
    expect((flowShape as SVGElement).style.display).not.toBe('none');

    harness.destroy();
  });

  it('preserves intermediate route points when linked nodes move', () => {
    const harness = mountWidget(Main, {
      position: { x: 233.5, y: 287.25 },
      size: { width: 490.5, height: 296.75 },
      linkedNodes: {
        source: {
          id: 'source',
          position: { x: 207.5, y: 261.25 },
          size: { width: 100, height: 100 },
        },
        target: {
          id: 'target',
          position: { x: 660, y: 480 },
          size: { width: 80, height: 80 },
        },
      },
      props: {
        points: [
          { x: 24, y: 24 },
          { x: 345.25, y: 24 },
          { x: 345.25, y: 272.75 },
          { x: 466.5, y: 272.75 },
        ],
        sourceNodeId: 'source',
        sourceAnchor: 'center',
        targetNodeId: 'target',
        targetAnchor: 'bottom',
      },
    } as any);

    const before = getWorldPathPoints(harness.element);

    harness.update({
      linkedNodes: {
        source: {
          id: 'source',
          position: { x: 267.5, y: 261.25 },
          size: { width: 100, height: 100 },
        },
        target: {
          id: 'target',
          position: { x: 660, y: 480 },
          size: { width: 80, height: 80 },
        },
      },
    } as any);

    const after = getWorldPathPoints(harness.element);

    expect(before.length).toBeGreaterThanOrEqual(4);
    expect(after.length).toBeGreaterThanOrEqual(3);
    expect(after[0]).not.toEqual(before[0]);
    expect(after[after.length - 1]).toEqual(before[before.length - 1]);
    expect(
      after.every((point, index) => {
        if (index === 0) return true;
        const prev = after[index - 1]!;
        return point.x === prev.x || point.y === prev.y;
      }),
    ).toBe(true);

    harness.destroy();
  });

  it('renders connected pipes from canonical local points when linked nodes are unavailable', () => {
    document.body.innerHTML = `
      <div id="mount" style="position:relative; width:1200px; height:800px;">
        <div class="thingsvis-widget-layer">
          <div data-overlay-node-id="left" style="position:absolute; left:120px; top:180px; width:120px; height:80px;"></div>
          <div data-overlay-node-id="right" style="position:absolute; left:520px; top:220px; width:120px; height:80px;"></div>
        </div>
      </div>
    `;
    mockRect(document.getElementById('mount'), { left: 0, top: 0, width: 1200, height: 800 });
    mockRect(document.querySelector('[data-overlay-node-id="left"]'), { left: 120, top: 180, width: 120, height: 80 });
    mockRect(document.querySelector('[data-overlay-node-id="right"]'), { left: 520, top: 220, width: 120, height: 80 });

    const harness = mountWidget(Main, {
      position: { x: 220, y: 190 },
      size: { width: 260, height: 120 },
      props: {
        sourceNodeId: 'left',
        sourceAnchor: 'right',
        targetNodeId: 'right',
        targetAnchor: 'left',
        points: [
          { x: 20, y: 30 },
          { x: 160, y: 30 },
          { x: 160, y: 70 },
          { x: 300, y: 70 },
        ],
      },
    } as any);

    expect(getWorldPathPoints(harness.element)).toEqual([
      { x: 20, y: 30 },
      { x: 160, y: 30 },
      { x: 160, y: 70 },
      { x: 300, y: 70 },
    ]);

    harness.destroy();
  });

  it('normalizes legacy near-horizontal dirty points into a straight rendered segment', () => {
    const harness = mountWidget(Main, {
      position: { x: 220, y: 190 },
      size: { width: 320, height: 120 },
      props: {
        points: [
          { x: 0, y: 40 },
          { x: 260, y: 41 },
        ],
      },
    } as any);

    expect(getWorldPathPoints(harness.element)).toEqual([
      { x: 0, y: 40 },
      { x: 260, y: 40 },
    ]);

    harness.destroy();
  });
});
