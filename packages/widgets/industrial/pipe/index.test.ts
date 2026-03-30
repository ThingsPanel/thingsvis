import { afterEach, describe, expect, it } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import Main from './src/index';
import { getDefaultProps } from './src/schema';

const defaults = getDefaultProps();

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

    expect(before).toHaveLength(4);
    expect(after).toHaveLength(4);
    expect(after[1]).toEqual(before[1]);
    expect(after[2]).toEqual(before[2]);
    expect(after[0]?.x).toBeGreaterThan(before[0]?.x ?? 0);

    harness.destroy();
  });
});
