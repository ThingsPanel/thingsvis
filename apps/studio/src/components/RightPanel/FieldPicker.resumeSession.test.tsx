import React, { act, useState } from 'react';
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

vi.mock('./DeviceSelectorModal', () => ({ DeviceSelectorModal: () => null }));

import { FieldPicker, type FieldPickerValue } from './FieldPicker';
import { dataSourceManager, store } from '@/lib/store';
import {
  clearEmbedSessionSnapshot,
  getEmbedSessionSnapshot,
  setEmbedSessionSnapshot,
} from '@/lib/embed/sessionSnapshot';
import { restoreProjectDataSources } from '@/lib/embed/projectDataSourceRestore';
import type { ProjectFile } from '@/lib/storage/schemas';
import { platformFieldStore } from '@/lib/stores/platformFieldStore';

describe('FieldPicker resumed custom data sources', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    window.location.hash =
      '#/editor/host-1?mode=embedded&saveTarget=host&provider=thingspanel&context=device-template&resumeSession=1';
    clearEmbedSessionSnapshot();
    platformFieldStore.setFields([
      { id: 'device_temperature', name: 'Device temperature', type: 'number' },
    ]);
    await dataSourceManager.resetRuntimeDataSources();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    clearEmbedSessionSnapshot();
    platformFieldStore.clearFields();
    await dataSourceManager.resetRuntimeDataSources();
  });

  it('offers a resumed STATIC source and its JSON fields in the custom group', async () => {
    const project: ProjectFile = {
      meta: {
        id: 'host-1',
        name: 'Host project',
        version: '1.0.0',
        createdAt: 1,
        updatedAt: 2,
      },
      canvas: { mode: 'fixed', width: 1920, height: 1080, background: '#000000' },
      nodes: [],
      dataSources: [
        {
          id: 'thingspanel_device_summary',
          name: 'Hidden dashboard summary',
          type: 'STATIC',
          config: { value: { device_total: 10 } },
          mode: 'auto',
        },
        {
          id: 'custom_metrics',
          name: 'Custom metrics',
          type: 'STATIC',
          config: { value: { temperature: 26.5, online: true } },
          mode: 'auto',
        },
      ],
      variables: [],
    };
    setEmbedSessionSnapshot(project.meta.id, project, 'host-save');

    const resumedProject = getEmbedSessionSnapshot('host-1')?.project;
    await act(async () => restoreProjectDataSources(resumedProject?.dataSources));
    await act(async () => {
      root.render(<FieldPickerHarness />);
    });

    const scopeSelect = container.querySelector('select');
    expect(scopeSelect?.querySelector('option[value="device"]')).not.toBeNull();
    expect(scopeSelect?.querySelector('option[value="custom"]')).not.toBeNull();
    expect(scopeSelect?.querySelector('option[value="global"]')).toBeNull();
    expect(container.querySelector('option[value="thingspanel_device_summary"]')).toBeNull();
    await act(async () => {
      if (!scopeSelect) return;
      scopeSelect.value = 'custom';
      scopeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const selects = Array.from(container.querySelectorAll('select'));
    expect(selects[1]?.querySelector('option[value="custom_metrics"]')?.textContent).toContain(
      'Custom metrics',
    );
    const fieldOptions = Array.from(selects.at(-1)?.querySelectorAll('option') ?? []).map(
      (option) => option.value,
    );
    expect(fieldOptions).toEqual(expect.arrayContaining(['temperature', 'online']));
  });
});

function FieldPickerHarness() {
  const [value, setValue] = useState<FieldPickerValue | null>(null);
  return <FieldPicker kernelStore={store} value={value} onChange={setValue} />;
}
