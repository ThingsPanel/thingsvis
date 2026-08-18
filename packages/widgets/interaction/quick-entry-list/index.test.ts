import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import { controls } from './src/controls';
import { getDefaultProps } from './src/schema';

describe('interaction/quick-entry-list', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('provides three editable default links', () => {
    const props = getDefaultProps();
    expect(props.items.map((item) => item.id)).toEqual(['ai-chat', 'docs', 'open-source']);
    expect(props.items[2]?.url).toBe('https://github.com/ThingsPanel/thingsvis');
    const field = controls.groups.flatMap((group) => group.fields).find((item) => item.path === 'items');
    expect(field).toMatchObject({ kind: 'json', binding: { enabled: true } });
  });

  it('renders configured entries and opens safe links', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { default: Main } = await import('./src/index');
    const widget = mountWidget(Main, {
      mode: 'view',
      props: {
        title: '帮助中心',
        items: [{ id: 'docs', title: '文档', description: '使用说明', icon: 'book-open', url: 'https://docs.thingspanel.cn/zh-Hans/' }],
      },
    });
    expect(widget.element.textContent).toContain('帮助中心');
    expect(widget.element.textContent).toContain('使用说明');
    widget.element.querySelector('button')?.click();
    expect(open).toHaveBeenCalledWith('https://docs.thingspanel.cn/zh-Hans/', '_blank', 'noopener,noreferrer');
    widget.destroy();
  });

  it('does not open unsafe protocols', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { default: Main } = await import('./src/index');
    const widget = mountWidget(Main, {
      mode: 'view',
      props: { items: [{ id: 'unsafe', title: 'Unsafe', url: 'javascript:alert(1)' }] },
    });
    widget.element.querySelector('button')?.click();
    expect(open).not.toHaveBeenCalled();
    widget.destroy();
  });
});
