import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./DeviceSelectorModal', () => ({ DeviceSelectorModal: () => null }));

import { RealtimeHistoryConfigEditor } from './RealtimeHistoryConfigEditor';
import { platformDeviceStore } from '@/lib/stores/platformDeviceStore';
import { platformFieldStore } from '@/lib/stores/platformFieldStore';

describe('RealtimeHistoryConfigEditor in a device template', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    window.location.hash = '#/editor/host-1?mode=embedded&context=device-template';
    platformDeviceStore.clearDevices();
    platformFieldStore.setFields([
      { id: 'temperature', name: '温度', type: 'number', dataType: 'telemetry', unit: '℃' },
      { id: 'status', name: '状态', type: 'boolean', dataType: 'telemetry' },
    ]);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    platformFieldStore.clearFields();
    window.location.hash = '';
  });

  it('uses model telemetry fields and saves the template device id', async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(
        <RealtimeHistoryConfigEditor
          value={{ data: { deviceId: 'old-device', metricKeys: ['temperature'] } }}
          onChange={onChange}
        />,
      );
    });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deviceId: '__template__', metricKeys: ['temperature'] }),
      }),
    );
    expect(container.textContent).toContain('温度 (℃)');
    expect(container.textContent).not.toContain('状态');
    expect(container.querySelector('button:disabled')?.textContent).toContain('物模型字段');
  });

  it('keeps the dashboard device selection unchanged', async () => {
    window.location.hash = '#/editor/host-1?mode=embedded&context=dashboard';
    platformDeviceStore.setDevices([
      {
        deviceId: 'dev-1',
        deviceName: '设备一',
        fields: [{ id: 'temperature', name: '温度', type: 'number', dataType: 'telemetry' }],
      },
    ]);
    const onChange = vi.fn();
    await act(async () => {
      root.render(
        <RealtimeHistoryConfigEditor
          value={{ data: { deviceId: 'dev-1', metricKeys: ['temperature'] } }}
          onChange={onChange}
        />,
      );
    });

    expect(container.querySelector('button:not(:disabled)')?.textContent).toContain('设备一');
    expect(onChange).not.toHaveBeenCalled();
  });
});
