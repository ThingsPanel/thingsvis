import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { PreviewToolbar } from './PreviewToolbar';

describe('PreviewToolbar', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  function renderToolbar() {
    act(() => {
      root.render(
        <PreviewToolbar
          isFullscreen={false}
          isGridLayout
          scaleMode="fit-min"
          onRefresh={vi.fn()}
          onToggleFullscreen={vi.fn()}
          onScaleModeChange={vi.fn()}
        />,
      );
    });
  }

  it('only renders the compact trigger until the pointer enters', () => {
    renderToolbar();

    expect(container.querySelector('[title="Refresh"]')).toBeNull();
    const toolbar = container.firstElementChild as HTMLElement;

    act(() => toolbar.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })));

    expect(container.querySelector('[title="Refresh"]')).not.toBeNull();
  });

  it('collapses after the pointer leaves', () => {
    renderToolbar();
    const toolbar = container.firstElementChild as HTMLElement;

    act(() => toolbar.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })));
    act(() => toolbar.dispatchEvent(new PointerEvent('pointerout', { bubbles: true })));
    act(() => vi.advanceTimersByTime(500));

    expect(container.querySelector('[title="Refresh"]')).toBeNull();
  });
});
