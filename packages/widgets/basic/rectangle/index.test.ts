import { afterEach, describe, expect, it } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import { controls } from './src/controls';

describe('basic/rectangle fill binding', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('exposes fill as a bindable color field', () => {
    const field = controls.groups.flatMap((group) => group.fields).find((item) => item.path === 'fill');
    expect(field).toMatchObject({
      kind: 'color',
      binding: { enabled: true, modes: ['static', 'field', 'expr'] },
    });
  });

  it('updates the rendered fill color', async () => {
    const { default: Main } = await import('./src/index');
    const widget = mountWidget(Main, { mode: 'view', props: { fill: '#123456' } });
    expect(widget.element.style.backgroundColor).toBe('rgb(18, 52, 86)');

    widget.update({ props: { fill: '#abcdef' } });
    expect(widget.element.style.backgroundColor).toBe('rgb(171, 205, 239)');
    widget.destroy();
  });
});
