import { afterEach, describe, expect, it } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import { controls } from './src/controls';
import Main from './src/index';

describe('basic/straight-line widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a standalone horizontal line with no connection metadata', () => {
    const harness = mountWidget(Main, { size: { width: 160, height: 20 } });
    const line = harness.element.querySelector('line');
    expect(line?.getAttribute('x1')).toBe('1');
    expect(line?.getAttribute('y1')).toBe('50');
    expect(line?.getAttribute('x2')).toBe('99');
    expect(line?.getAttribute('y2')).toBe('50');
    expect(Main.schema.safeParse({ sourceNodeId: 'node-1' }).data).not.toHaveProperty(
      'sourceNodeId',
    );
    harness.destroy();
  });

  it('updates color, width, and dash style', () => {
    const harness = mountWidget(Main);
    harness.update({ props: { stroke: '#ef4444', strokeWidth: 4, strokeStyle: 'dashed' } });
    const line = harness.element.querySelector('line');
    expect(line?.getAttribute('stroke')).toBe('#ef4444');
    expect(line?.getAttribute('stroke-width')).toBe('4');
    expect(line?.getAttribute('stroke-dasharray')).toBe('12 8');
    harness.destroy();
  });

  it('shows every line style as a segmented option', () => {
    const field = controls.groups
      .flatMap((group) => group.fields)
      .find((item) => item.path === 'strokeStyle');

    expect(field).toMatchObject({
      kind: 'segmented',
      options: [{ value: 'solid' }, { value: 'dashed' }, { value: 'dotted' }],
    });
  });
});
