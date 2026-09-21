import { describe, expect, it } from 'vitest';
import { getPlatformDeviceDataSourceId } from '@/embed/platformDeviceCompat';
import { hydrateDevicePresetWidget } from '@/lib/devicePresetHydration';
import { resolvePresetField } from './DeviceLibraryPanel';

describe('resolvePresetField', () => {
  const device = {
    deviceId: 'device-1',
    deviceName: 'Temperature and humidity sensor',
    fields: [
      { id: 'temperature', name: 'Temperature', alias: '温度', unit: '°C' },
      { id: 'humidity', name: 'Humidity', alias: '湿度', unit: '%RH' },
    ],
  };

  it('keeps an explicit preset field id', () => {
    expect(
      resolvePresetField(
        { id: 'preset-1', name: 'Value', fieldId: 'temperature', widget: {} },
        device,
      ),
    ).toEqual({ fieldId: 'temperature', fieldName: 'Temperature', unit: '°C' });
  });

  it('reads a field from an existing ThingsVis expression', () => {
    expect(
      resolvePresetField(
        {
          id: 'preset-2',
          name: 'Value',
          widget: { data: [{ expression: '{{ ds.__platform__.data.humidity }}' }] },
        },
        device,
      ),
    ).toEqual({ fieldId: 'humidity', fieldName: 'Humidity', unit: '%RH' });
  });

  it('maps a legacy pre-installed widget title to an actual model field', () => {
    const preset = {
      id: 'preset-3',
      name: 'Value',
      widget: { type: 'interaction/value-card', props: { title: 'temperature' } },
    };
    const resolved = resolvePresetField(preset, device);

    expect(resolved).toEqual({ fieldId: 'temperature', fieldName: 'Temperature', unit: '°C' });

    expect(
      hydrateDevicePresetWidget(preset.widget, device.deviceId, resolved ?? undefined).data,
    ).toEqual([
      {
        targetProp: 'value',
        expression: `{{ ds.${getPlatformDeviceDataSourceId(device.deviceId)}.data.temperature }}`,
      },
    ]);
    expect(
      hydrateDevicePresetWidget(preset.widget, device.deviceId, resolved ?? undefined).props,
    ).toEqual({ title: 'Temperature', suffix: '°C' });
  });
});
