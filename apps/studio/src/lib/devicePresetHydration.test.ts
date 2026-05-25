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
                expression: '{{ ds.__device_platform_template__.data.temperature__history }}',
              },
            ],
          } as any,
        ],
        dataSources: [
          {
            id: '__device_platform_template__',
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
            expression: '{{ ds.__device_platform_template__.data.temperature }}',
          },
        ],
      },
      'dev-200',
    );

    expect((hydrated.data as Array<{ expression: string }>)[0]?.expression).toBe(
      `{{ ds.${getPlatformDeviceDataSourceId('dev-200')}.data.temperature }}`,
    );
  });

  it('normalizes auto-write payload keys from expression bindings', () => {
    const hydrated = hydrateDevicePresetWidget(
      {
        id: 'node-1',
        type: 'interaction/basic-select',
        data: [
          {
            targetProp: 'value',
            expression: '{{ ds.__device_platform_template__.data.switch ? "1" : "0" }}',
          },
        ],
        events: [
          {
            event: 'change',
            actions: [
              {
                type: 'callWrite',
                dataSourceId: '__device_platform_template__',
                payload: `({ "switch ? '1' : '0'": payload })`,
                __thingsvisAutoWrite: 'field-binding',
              },
            ],
          },
        ],
      },
      'dev-201',
    ) as any;

    expect(hydrated.events?.[0]?.actions?.[0]?.dataSourceId).toBe(
      getPlatformDeviceDataSourceId('dev-201'),
    );
    expect(hydrated.events?.[0]?.actions?.[0]?.payload).toBe('({ "switch": payload })');
  });

  it('rewrites template-device platform data sources saved by the embedded editor', () => {
    const templateDataSourceId = getPlatformDeviceDataSourceId('__template__');
    const hydrated = hydrateDevicePresetSchema(
      {
        nodes: [
          {
            id: 'node-1',
            type: 'chart/uplot-line',
            position: { x: 0, y: 0 },
            size: { width: 320, height: 180 },
            props: {
              title: `{{ ds.${templateDataSourceId}.data.temperature }}`,
            },
            data: [
              {
                targetProp: 'data',
                expression: `{{ ds.${templateDataSourceId}.data.temperature__history }}`,
              },
            ],
          } as any,
        ],
        dataSources: [
          {
            id: templateDataSourceId,
            name: '当前物模型',
            type: 'PLATFORM_FIELD',
            config: {
              source: 'platform',
              deviceId: '__template__',
              requestedFields: ['temperature'],
              bufferSize: 100,
            },
          } as DataSource,
        ],
      },
      'dev-300',
    );

    const targetDataSourceId = getPlatformDeviceDataSourceId('dev-300');
    const firstNode = hydrated.nodes?.[0] as any;
    const firstDataSource = hydrated.dataSources?.[0] as any;
    expect(firstNode?.props?.title).toBe(`{{ ds.${targetDataSourceId}.data.temperature }}`);
    expect(firstNode?.data?.[0]?.expression).toBe(
      `{{ ds.${targetDataSourceId}.data.temperature__history }}`,
    );
    expect(firstDataSource?.id).toBe(targetDataSourceId);
    expect(firstDataSource?.config?.deviceId).toBe('dev-300');
  });
});
