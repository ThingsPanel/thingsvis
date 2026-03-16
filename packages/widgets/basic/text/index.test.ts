import { afterEach, describe, expect, it } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import Main from './src/index';

describe('basic/text widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a localized preview placeholder before text is configured', () => {
    const harness = mountWidget(Main, { locale: 'en' });
    const textEl = harness.element.querySelector('[data-thingsvis-measure="1"]');

    expect(textEl?.textContent).toBe('Enter text');
    expect(textEl?.getAttribute('data-thingsvis-placeholder')).toBe('true');

    harness.destroy();
  });

  it('updates to bound text content without keeping the placeholder state', () => {
    const harness = mountWidget(Main, {
      locale: 'en',
      props: { text: '' },
    });

    harness.update({
      props: {
        text: 'CPU load',
        fontSize: 24,
      },
    });

    const textEl = harness.element.querySelector('[data-thingsvis-measure="1"]');
    expect(textEl?.textContent).toBe('CPU load');
    expect(textEl?.getAttribute('data-thingsvis-placeholder')).toBe('false');
    expect((textEl as HTMLElement).style.fontSize).toBe('24px');

    harness.destroy();
  });
});
