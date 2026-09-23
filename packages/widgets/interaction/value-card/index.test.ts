import { afterEach, describe, expect, it } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import Main from './src/index';

function getCardRoot(element: HTMLElement): HTMLElement | null {
  return element.firstElementChild as HTMLElement | null;
}

describe('interaction/value-card widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('leaves the content inset to the host card', () => {
    const harness = mountWidget(Main, {
      locale: 'zh',
      props: Main.schema.parse({}),
    });

    const cardRoot = getCardRoot(harness.element);
    expect(cardRoot?.style.padding).toBe('');
    expect(cardRoot?.style.boxSizing).toBe('border-box');

    harness.destroy();
  });

  it('shows only icon, title, value, and suffix by default', () => {
    const harness = mountWidget(Main, {
      locale: 'zh',
      props: Main.schema.parse({}),
    });

    const html = harness.element.innerHTML;
    expect(html).toContain('总览数值');
    expect(html).toContain('0.00');
    expect(html).toContain('元');
    expect(html).not.toContain('较上月');
    expect(html).not.toContain('▲');
    expect(html).not.toContain('▼');
    expect(html).not.toContain('￥');

    harness.destroy();
  });

  it('uses a persisted device-model unit over the default suffix', () => {
    const harness = mountWidget(Main, {
      locale: 'zh',
      props: Main.schema.parse({ title: 'illuminance', value: 178, suffix: '元', unit: 'lux' }),
    });

    const html = harness.element.innerHTML;
    expect(html).toContain('illuminance');
    expect(html).toContain('178.00');
    expect(html).toContain('lux');
    expect(html).not.toContain('元');

    harness.destroy();
  });

  it('does not add a second inset when persistence supplies a transparent background', () => {
    const harness = mountWidget(Main, {
      locale: 'zh',
      props: Main.schema.parse({}),
      baseStyle: {
        background: {
          color: 'transparent',
          opacity: 1,
        },
      },
    });

    const cardRoot = getCardRoot(harness.element);
    expect(cardRoot?.style.padding).toBe('');

    harness.destroy();
  });

  it('leaves padding to the host for an auto card with a transparent background', () => {
    const harness = mountWidget(Main, {
      locale: 'zh',
      props: Main.schema.parse({}),
      baseStyle: {
        background: {
          color: 'transparent',
          opacity: 1,
        },
        card: {
          enabled: true,
          appearance: 'auto',
        },
      },
    });

    const cardRoot = getCardRoot(harness.element);
    expect(cardRoot?.style.padding).toBe('');

    harness.destroy();
  });

  it('leaves padding to the host for legacy enabled cards', () => {
    const harness = mountWidget(Main, {
      locale: 'zh',
      props: Main.schema.parse({}),
      baseStyle: {
        background: { color: 'transparent', opacity: 1 },
        card: { enabled: true },
      },
    });

    const cardRoot = getCardRoot(harness.element);
    expect(cardRoot?.style.padding).toBe('');

    harness.destroy();
  });
});
