import { describe, expect, it } from 'vitest';
import type { DataSource } from '@thingsvis/schema';
import { getPlatformDeviceDataSourceId } from '@/embed/platformDeviceCompat';
import { hydrateDevicePresetSchema, hydrateDevicePresetWidget } from './devicePresetHydration';

describe('devicePresetHydration', () => {
  it('rewrites generic platform bindings and datasource ids for schema presets', () => {
    const hydrated = hydrateDevicePresetSchema(
      {
        nodes: [
          {
            id: 'node-1',
            type: 'chart/uplot-line',
            position: { x: 0, y: 0 },
            size: { width: 320, height: 180 },
            props: { data: [] },
            data: [
              {
                targetProp: 'data',
                expression: '{{ ds.__platform__.data.temperature__history }}',
              },
            ],
          } as any,
        ],
        dataSources: [
          {
            id: '__platform__',
            name: 'Template Device',
            type: 'PLATFORM_FIELD',
            config: {
              source: 'platform',
              fieldMappings: {},
              bufferSize: 64,
              requestedFields: ['temperature'],
            },
          } as DataSource,
        ],
      },
      'dev-100',
    );

    const firstNode = hydrated.nodes?.[0] as any;
    const firstDataSource = hydrated.dataSources?.[0] as any;
    expect(firstNode?.data?.[0]?.expression).toBe(
      `{{ ds.${getPlatformDeviceDataSourceId('dev-100')}.data.temperature__history }}`,
    );
    expect(firstDataSource?.id).toBe(getPlatformDeviceDataSourceId('dev-100'));
    expect(firstDataSource?.config?.deviceId).toBe('dev-100');
  });

  it('rewrites generic platform bindings for legacy single-node widget presets', () => {
    const hydrated = hydrateDevicePresetWidget(
      {
        id: 'node-1',
        type: 'basic/text',
        props: { text: '0' },
        data: [
          {
            targetProp: 'text',
            expression: '{{ ds.__platform__.data.temperature }}',
          },
        ],
      },
      'dev-200',
    );

    expect((hydrated.data as Array<{ expression: string }>)[0]?.expression).toBe(
      `{{ ds.${getPlatformDeviceDataSourceId('dev-200')}.data.temperature }}`,
    );
  });
});
