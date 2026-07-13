import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const registry = vi.hoisted(() => ({
  states: {} as Record<string, unknown>,
}));

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  keys: vi.fn().mockResolvedValue([]),
}));

vi.mock('@thingsvis/ui', () => ({
  useDataSourceRegistry: () => ({ states: registry.states }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'zh', resolvedLanguage: 'zh' },
  }),
}));

vi.mock('./DeviceSelectorModal', () => ({ DeviceSelectorModal: () => null }));

import { FieldPicker, type FieldPickerValue } from './FieldPicker';
import { store } from '@/lib/store';
import { platformDeviceStore } from '@/lib/stores/platformDeviceStore';

describe('FieldPicker device fields', () => {
  let container: HTMLDivElement;
  let root: Root;
  let parentDescriptor: PropertyDescriptor | undefined;
  let postMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    window.location.hash =
      '#/editor/host-1?mode=embedded&saveTarget=host&provider=thingspanel&context=dashboard';
    registry.states = {};
    platformDeviceStore.clearDevices();
    parentDescriptor = Object.getOwnPropertyDescriptor(window, 'parent');
    postMessage = vi.fn();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    platformDeviceStore.clearDevices();
    if (parentDescriptor) Object.defineProperty(window, 'parent', parentDescriptor);
  });

  it('requests and caches fields for a device without a thing model', async () => {
    platformDeviceStore.setDevices([
      { deviceId: 'raw-device', deviceName: 'Raw device', groupId: 'group-1' },
    ]);

    await renderPicker({ dataSourceId: '__platform_raw-device__', fieldPath: '' });

    expect(postMessage).toHaveBeenCalledWith(
      {
        type: 'thingsvis:requestDeviceFields',
        payload: {
          deviceId: 'raw-device',
          templateId: undefined,
          deviceConfigId: undefined,
        },
      },
      '*',
    );

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: {
            type: 'tv:device-fields',
            payload: {
              deviceId: 'raw-device',
              fields: [
                { id: 'temperature', name: 'Temperature', type: 'number', dataType: 'telemetry' },
                { id: 'location', name: 'Location', type: 'string', dataType: 'attribute' },
                { id: 'legacy', name: 'Legacy field', type: 'string' },
                { id: 'restart', name: 'Restart', type: 'boolean', dataType: 'command' },
                { id: 'alarm', name: 'Alarm', type: 'string', dataType: 'event' },
              ],
            },
          },
        }),
      );
    });

    expect(platformDeviceStore.getDevices()[0]?.fields).toHaveLength(5);
    expect(fieldOptionValues()).toEqual(expect.arrayContaining(['temperature', 'location']));
    expect(fieldOptionValues()).not.toEqual(expect.arrayContaining(['legacy', 'restart', 'alarm']));
  });

  it('shows only the host catalog for a device with a thing model', async () => {
    registry.states = {
      '__platform_modeled-device__': {
        status: 'connected',
        data: { temperature: 25, runtimeExtraKey: 99 },
      },
    };
    platformDeviceStore.setDevices([
      {
        deviceId: 'modeled-device',
        deviceName: 'Modeled device',
        groupId: 'group-1',
        templateId: 'template-1',
        fields: [
          { id: 'temperature', name: 'Temperature', type: 'number', dataType: 'telemetry' },
          { id: 'location', name: 'Location', type: 'string', dataType: 'attribute' },
          { id: 'restart', name: 'Restart', type: 'boolean', dataType: 'command' },
          { id: 'alarm', name: 'Alarm', type: 'string', dataType: 'event' },
        ],
      },
    ]);

    await renderPicker({ dataSourceId: '__platform_modeled-device__', fieldPath: '' });

    expect(postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'thingsvis:requestDeviceFields' }),
      '*',
    );
    expect(fieldOptionValues()).toEqual(expect.arrayContaining(['temperature', 'location']));
    expect(fieldOptionValues()).not.toEqual(
      expect.arrayContaining(['restart', 'alarm', 'runtimeExtraKey']),
    );
  });

  it('does not fall back to runtime snapshot fields when the host catalog is empty', async () => {
    registry.states = {
      '__platform_runtime-device__': {
        status: 'connected',
        data: { is_online: true, last_push_time: 'now', warn_status: 'normal' },
      },
    };
    platformDeviceStore.setDevices([
      { deviceId: 'runtime-device', deviceName: 'Runtime device', groupId: 'group-1' },
    ]);

    await renderPicker({ dataSourceId: '__platform_runtime-device__', fieldPath: '' });

    expect(fieldOptionValues()).not.toEqual(
      expect.arrayContaining(['is_online', 'last_push_time', 'warn_status']),
    );
  });

  it('ignores a stale field response after switching devices', async () => {
    platformDeviceStore.setDevices([
      { deviceId: 'device-a', deviceName: 'Device A', groupId: 'group-1' },
      { deviceId: 'device-b', deviceName: 'Device B', groupId: 'group-1' },
    ]);

    await renderPicker({ dataSourceId: '__platform_device-a__', fieldPath: '' });
    await renderPicker({ dataSourceId: '__platform_device-b__', fieldPath: '' });

    await dispatchDeviceFields('device-a', [
      { id: 'field_a', name: 'Field A', type: 'number', dataType: 'telemetry' },
    ]);

    expect(
      platformDeviceStore.getDevices().find((device) => device.deviceId === 'device-a')?.fields,
    ).toBeUndefined();
    expect(fieldOptionValues()).not.toContain('field_a');

    await dispatchDeviceFields('device-b', [
      { id: 'field_b', name: 'Field B', type: 'number', dataType: 'telemetry' },
    ]);

    expect(
      platformDeviceStore.getDevices().find((device) => device.deviceId === 'device-b')?.fields,
    ).toEqual([{ id: 'field_b', name: 'Field B', type: 'number', dataType: 'telemetry' }]);
    expect(fieldOptionValues()).toContain('field_b');
    expect(fieldOptionValues()).not.toContain('field_a');
  });

  it('keeps history limited to numeric telemetry fields', async () => {
    platformDeviceStore.setDevices([
      {
        deviceId: 'history-device',
        deviceName: 'History device',
        groupId: 'group-1',
        fields: [
          { id: 'temperature', name: 'Temperature', type: 'number', dataType: 'telemetry' },
          { id: 'state', name: 'State', type: 'string', dataType: 'telemetry' },
          { id: 'threshold', name: 'Threshold', type: 'number', dataType: 'attribute' },
        ],
      },
    ]);

    await renderPicker({ dataSourceId: '__platform_history-device__', fieldPath: '' }, 'json');
    const dataTypeSelect = Array.from(container.querySelectorAll('select')).find((select) =>
      select.querySelector('option[value="history"]'),
    );
    expect(dataTypeSelect).toBeDefined();

    await act(async () => {
      if (!dataTypeSelect) return;
      dataTypeSelect.value = 'history';
      dataTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(fieldOptionValues()).toContain('temperature__history');
    expect(fieldOptionValues()).not.toEqual(
      expect.arrayContaining(['state__history', 'threshold__history']),
    );
  });

  it('hides history for scalar targets and resets an incompatible saved history selection', async () => {
    platformDeviceStore.setDevices([
      {
        deviceId: 'scalar-device',
        deviceName: 'Scalar device',
        groupId: 'group-1',
        fields: [{ id: 'temperature', name: 'Temperature', type: 'number', dataType: 'telemetry' }],
      },
    ]);
    const onChange = vi.fn();

    await renderPicker(
      {
        dataSourceId: '__platform_scalar-device__',
        fieldPath: 'temperature__history',
        historyConfig: { timeRange: 'last_30d' },
      },
      'number',
      onChange,
    );

    expect(
      Array.from(container.querySelectorAll('option')).some((option) => option.value === 'history'),
    ).toBe(false);
    expect(onChange).toHaveBeenCalledWith({
      dataSourceId: '__platform_scalar-device__',
      fieldPath: '',
      transform: undefined,
    });
  });

  async function renderPicker(
    value: FieldPickerValue,
    targetKind?: string,
    onChange: (next: FieldPickerValue | null) => void = vi.fn(),
  ) {
    await act(async () => {
      root.render(
        <FieldPicker
          kernelStore={store}
          value={value}
          targetKind={targetKind}
          onChange={onChange}
        />,
      );
    });
  }

  async function dispatchDeviceFields(deviceId: string, fields: unknown[]) {
    await act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'tv:device-fields', payload: { deviceId, fields } },
        }),
      );
    });
  }

  function fieldOptionValues(): string[] {
    const selects = Array.from(container.querySelectorAll('select'));
    return Array.from(selects.at(-1)?.querySelectorAll('option') ?? []).map(
      (option) => option.value,
    );
  }
});
