import { afterEach, describe, expect, it } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import { controls } from './src/controls';
import { getDefaultProps } from './src/schema';

describe('interaction/basic-button fill color', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps theme color as default and exposes a bindable fill color', () => {
    const field = controls.groups.flatMap((group) => group.fields).find((item) => item.path === 'fillColor');
    expect(getDefaultProps().fillColor).toBe('');
    expect(field).toMatchObject({ kind: 'color', binding: { enabled: true, modes: ['static', 'field', 'expr'] } });
  });

  it('uses the configured fill color and keeps outline transparent', async () => {
    const { default: Main } = await import('./src/index');
    const widget = mountWidget(Main, { mode: 'view', props: { fillColor: '#123456' } });
    expect(widget.element.innerHTML).toContain('background: #123456');
    widget.update({ props: { variant: 'outline', fillColor: '#abcdef' } });
    expect(widget.element.innerHTML).toContain('background: transparent');
    widget.destroy();
  });
});
