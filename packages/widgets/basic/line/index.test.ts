import { afterEach, describe, expect, it } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import Main from './src/index';

describe('basic/line widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a visible connector path with the standardized defaults', () => {
    const harness = mountWidget(Main, {
      size: { width: 240, height: 24 },
    });

    const svg = harness.element.querySelector('svg');
    const path = harness.element.querySelector('path[stroke]');

    expect(svg?.getAttribute('viewBox')).toBe('0 0 240 24');
    expect(path?.getAttribute('d')).toContain('M 0 12 L 232 12');

    harness.destroy();
  });

  it('updates stroke styling and redraws on resize without remounting', () => {
    const harness = mountWidget(Main, {
      size: { width: 180, height: 24 },
    });

    harness.update({
      size: { width: 300, height: 48 },
      props: {
        stroke: '#ef4444',
        strokeWidth: 6,
        arrowEnd: 'arrow',
      },
    });

    const svg = harness.element.querySelector('svg');
    const visibleShape = harness.element.querySelector('polyline[stroke], path[stroke]');

    expect(svg?.getAttribute('viewBox')).toBe('0 0 300 48');
    expect(visibleShape?.getAttribute('stroke')).toBe('#ef4444');
    expect(visibleShape?.getAttribute('stroke-width')).toBe('6');

    harness.destroy();
  });
});
