import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  keys: vi.fn().mockResolvedValue([]),
}));

vi.mock('@thingsvis/ui', async () => {
  const ReactModule = await import('react');
  return {
    useDataSourceRegistry: (kernelStore: typeof store) => ({
      states: ReactModule.useSyncExternalStore(
        kernelStore.subscribe,
        () => kernelStore.getState().dataSources,
      ),
    }),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'zh', resolvedLanguage: 'zh' },
  }),
}));

vi.mock('@uiw/react-codemirror', () => ({ default: () => null }));
vi.mock('@codemirror/lang-json', () => ({ json: () => [] }));

import DataSourcesPage from './DataSourcesPage';
import { dataSourceManager, store } from '@/lib/store';

describe('DataSourcesPage device-template provider filtering', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    window.location.hash =
      '#/data-sources?mode=embedded&saveTarget=host&provider=thingspanel&context=device-template';
    await dataSourceManager.resetRuntimeDataSources();
    await dataSourceManager.registerDataSource(
      {
        id: 'thingspanel_device_summary',
        name: 'Hidden dashboard summary',
        type: 'STATIC',
        config: { value: { device_total: 10 } },
      },
      false,
    );
    await dataSourceManager.registerDataSource(
      {
        id: 'custom_metrics',
        name: 'Custom metrics',
        type: 'STATIC',
        config: { value: { temperature: 26.5 } },
      },
      false,
    );
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    await dataSourceManager.resetRuntimeDataSources();
  });

  it('keeps custom sources but hides an already registered dashboard provider source', async () => {
    await act(async () => root.render(<DataSourcesPage />));

    expect(container.textContent).toContain('Custom metrics');
    expect(container.textContent).not.toContain('Hidden dashboard summary');
    expect(container.textContent).not.toContain('thingspanel_device_summary');
  });
});
