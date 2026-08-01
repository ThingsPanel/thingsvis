import { describe, expect, it } from 'vitest';
import {
  getActionDataSourceIds,
  normalizeDeviceTemplateWriteActions,
  TEMPLATE_DEVICE_DATA_SOURCE_ID,
} from './actionDataSources';

describe('ActionConfigEditor device-template writes', () => {
  it('always exposes current device without removing existing data sources', () => {
    expect(
      getActionDataSourceIds(['runtime-device', 'shared'], ['configured', 'shared'], true),
    ).toEqual([TEMPLATE_DEVICE_DATA_SOURCE_ID, 'configured', 'shared', 'runtime-device']);
  });

  it('does not add current device outside device-template context', () => {
    expect(getActionDataSourceIds(['runtime-device'], ['configured'], false)).toEqual([
      'configured',
      'runtime-device',
    ]);
  });

  it('defaults missing writes and migrates legacy platform writes without changing payloads', () => {
    const actions = normalizeDeviceTemplateWriteActions([
      { type: 'callWrite', payload: '({ any_key: 1 })' },
      { type: 'callWrite', dataSourceId: '__platform__', payload: '({ another_key: 2 })' },
      { type: 'callWrite', dataSourceId: 'custom-device', payload: '({ keep: 3 })' },
      { type: 'navigate', url: '/keep' },
    ]);

    expect(actions).toEqual([
      {
        type: 'callWrite',
        dataSourceId: TEMPLATE_DEVICE_DATA_SOURCE_ID,
        payload: '({ any_key: 1 })',
      },
      {
        type: 'callWrite',
        dataSourceId: TEMPLATE_DEVICE_DATA_SOURCE_ID,
        payload: '({ another_key: 2 })',
      },
      { type: 'callWrite', dataSourceId: 'custom-device', payload: '({ keep: 3 })' },
      { type: 'navigate', url: '/keep' },
    ]);
  });

  it('keeps already-normalized actions referentially stable', () => {
    const actions = [
      { type: 'callWrite' as const, dataSourceId: 'custom-device', payload: '({ key: 1 })' },
    ];
    expect(normalizeDeviceTemplateWriteActions(actions)).toBe(actions);
  });
});
