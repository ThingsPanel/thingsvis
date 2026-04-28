import { describe, expect, it } from 'vitest';
import {
  collectReferencedDataSourceIds,
  sanitizeDataSourcesForHostSave,
  TEMPLATE_DEVICE_ID,
} from './hostDataSourcePolicy';

describe('hostDataSourcePolicy', () => {
  it('collects datasource ids from expressions and explicit binding fields', () => {
    expect(
      Array.from(
        collectReferencedDataSourceIds({
          data: [
            { expression: '{{ ds.__platform_dev-1__.data.temperature }}' },
            { dataSourceId: 'thingspanel_device_summary' },
          ],
        }),
      ).sort(),
    ).toEqual(['__platform_dev-1__', 'thingspanel_device_summary']);
  });

  it('keeps only referenced generated host datasources for template host saves', () => {
    const sanitized = sanitizeDataSourcesForHostSave(
      [
        {
          id: 'node-1',
          data: [{ expression: '{{ ds.__platform___template____.data.temperature }}' }],
        },
      ],
      [
        {
          id: '__platform___template____',
          type: 'PLATFORM_FIELD',
          config: { source: 'platform', deviceId: TEMPLATE_DEVICE_ID, requestedFields: [] },
          __editorAutoManual: true,
          mode: 'manual',
        },
        {
          id: '__platform_dev-1__',
          type: 'PLATFORM_FIELD',
          config: { source: 'platform', deviceId: 'dev-1' },
        },
        {
          id: 'custom_rest',
          type: 'REST',
          config: { url: '/custom' },
        },
      ],
      'device-template',
    );

    expect(sanitized).toEqual([
      {
        id: '__platform___template____',
        type: 'PLATFORM_FIELD',
        config: { source: 'platform', requestedFields: [] },
      },
      {
        id: 'custom_rest',
        type: 'REST',
        config: { url: '/custom' },
      },
    ]);
  });

  it('keeps dashboard provider sources for dashboard host saves', () => {
    expect(
      sanitizeDataSourcesForHostSave(
        [],
        [{ id: 'thingspanel_device_summary', type: 'REST', config: { url: '/board/trend' } }],
        'dashboard',
      ),
    ).toEqual([
      { id: 'thingspanel_device_summary', type: 'REST', config: { url: '/board/trend' } },
    ]);
  });
});
