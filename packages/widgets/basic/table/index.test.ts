import { afterEach, describe, expect, it } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import Main from './src/index';

describe('basic/table widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders preview rows by default', () => {
    const harness = mountWidget(Main, { locale: 'en' });

    expect(Main.defaultProps.data.length).toBeGreaterThan(0);
    expect(harness.element.textContent).toContain('1号冷水机组');

    harness.destroy();
  });

  it('shows a localized empty state when rows are cleared', () => {
    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        data: [],
      },
    });

    expect(harness.element.textContent).toContain('Add rows or bind a table data set');

    harness.destroy();
  });
});
