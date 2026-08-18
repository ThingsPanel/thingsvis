import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import { getDefaultProps } from './src/schema';

describe('media/iframe', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('keeps the header hidden for existing widgets', () => {
    const props = getDefaultProps();
    expect(props.showHeader).toBe(false);
    expect(props.loadTimeout).toBe(10);
    expect(props.sandboxEnabled).toBe(true);
  });

  it('renders the compact header and secure iframe permissions', async () => {
    const { default: Main } = await import('./src/index');
    const widget = mountWidget(Main, {
      locale: 'zh-CN',
      mode: 'view',
      props: { src: 'https://example.com', title: '示例网页', showHeader: true, allowPopups: true },
    });
    const iframe = widget.element.querySelector('iframe');
    const header = widget.element.querySelector('header');
    expect(header?.textContent).toContain('示例网页');
    expect(header?.querySelectorAll('button')).toHaveLength(3);
    expect(iframe?.getAttribute('sandbox')).toContain('allow-popups');
    expect(iframe?.getAttribute('sandbox')).not.toContain('allow-downloads');
    expect(iframe?.getAttribute('allow')).toBe('fullscreen');
    widget.destroy();
  });

  it('shows the fallback actions after the configured timeout', async () => {
    const { default: Main } = await import('./src/index');
    const widget = mountWidget(Main, {
      locale: 'zh-CN',
      mode: 'view',
      props: { src: 'https://example.com', loadTimeout: 3 },
    });
    vi.advanceTimersByTime(3000);
    expect(widget.element.textContent).toContain('网页暂时无法显示');
    expect(widget.element.textContent).toContain('重新加载');
    expect(widget.element.textContent).toContain('新窗口打开');
    widget.destroy();
  });

  it('rejects unsafe URL schemes', async () => {
    const { default: Main } = await import('./src/index');
    const widget = mountWidget(Main, { locale: 'zh-CN', mode: 'view', props: { src: 'javascript:alert(1)' } });
    expect(widget.element.querySelector('iframe')?.hasAttribute('src')).toBe(false);
    expect(widget.element.textContent).toContain('网页暂时无法显示');
    widget.destroy();
  });
});
