import { afterEach, describe, expect, it } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import Main from './src/index';

describe('interaction/date-range-picker widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders preset labels from the active locale instead of hardcoded Chinese text', () => {
    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        showPresets: true,
      },
    });

    const presetTexts = Array.from(harness.element.querySelectorAll('.preset-btn')).map((button) => button.textContent?.trim());
    expect(presetTexts).toContain('Today');
    expect(presetTexts).toContain('Last 7 Days');
    expect(presetTexts).not.toContain('今天');

    harness.destroy();
  });
});
