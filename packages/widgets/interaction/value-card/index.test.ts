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

  it('keeps the default padding when no background is configured', () => {
    const harness = mountWidget(Main, {
      locale: 'zh',
      props: Main.schema.parse({}),
    });

    const cardRoot = getCardRoot(harness.element);
    expect(cardRoot?.style.padding).toBe('16px');

    harness.destroy();
  });

  it('collapses the default padding only for explicitly transparent backgrounds', () => {
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
    expect(cardRoot?.style.padding).toBe('0px');

    harness.destroy();
  });
});
