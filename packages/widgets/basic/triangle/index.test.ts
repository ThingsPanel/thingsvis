import { afterEach, describe, expect, it } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import Main from './src/index';

describe('basic/triangle widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders an upward triangle with fill and no default stroke', () => {
    const harness = mountWidget(Main, { size: { width: 100, height: 100 } });
    const path = harness.element.querySelector('path');
    expect(path?.getAttribute('d')).toBe('M 50 0 L 100 100 L 0 100 Z');
    expect(path?.getAttribute('fill')).toBe('#dbeafe');
    expect(path?.getAttribute('stroke')).toBe('none');
    harness.destroy();
  });

  it('updates fill and intrinsic outline', () => {
    const harness = mountWidget(Main);
    harness.update({ props: { fill: '#22c55e', stroke: '#14532d', strokeWidth: 4 } });
    const path = harness.element.querySelector('path');
    expect(path?.getAttribute('fill')).toBe('#22c55e');
    expect(path?.getAttribute('stroke')).toBe('#14532d');
    expect(path?.getAttribute('stroke-width')).toBe('4');
    expect(path?.getAttribute('stroke-linejoin')).toBe('miter');
    expect(path?.getAttribute('stroke-linecap')).toBe('butt');
    expect(path?.getAttribute('stroke-miterlimit')).toBe('20');
    expect(path?.getAttribute('d')).not.toContain(' Q ');
    harness.destroy();
  });

  it('uses the common corner radius to round all three vertices', () => {
    const harness = mountWidget(Main, { props: { cornerRadius: 10 } });
    const path = harness.element.querySelector('path');
    expect(path?.getAttribute('d')).toContain(' Q ');
    harness.destroy();
  });
});
