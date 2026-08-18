import { describe, expect, it } from 'vitest';
import { thingspanelCatalog } from './thingspanel.catalog';

function runTransformation(sourceId: string, data: unknown) {
  const source = thingspanelCatalog.dataSources.find((item) => item.id === sourceId);
  if (!source) throw new Error(`Missing source: ${sourceId}`);

  // eslint-disable-next-line no-new-func
  const fn = new Function('data', source.transformation);
  return fn(data);
}

describe('thingspanelCatalog', () => {
  it('uses the current alarm endpoint for dashboard alarm bindings', () => {
    const source = thingspanelCatalog.dataSources.find(
      (item) => item.id === 'thingspanel_home_alarm_history',
    );

    expect(source?.url).toBe('{{ var.platformApiBaseUrl }}/alarm/info');
  });

  it('preserves current alarm fields and adds widget-friendly aliases', () => {
    const result = runTransformation('thingspanel_home_alarm_history', {
      code: 200,
      data: {
        list: [
          {
            id: 'alarm-1',
            alarm_config_id: 'config-1',
            name: 'Temperature alarm',
            description: 'Temperature exceeded the threshold',
            content: '42 C',
            alarm_time: '2024-03-18T17:06:17.658Z',
            processor: 'user-1',
            processing_result: 'UND',
            tenant_id: 'tenant-1',
            remark: 'keep this field',
          },
        ],
        total: 1,
      },
    }) as Record<string, any>;

    expect(result.alarm_total).toBe(1);
    expect(result.unprocessed_alarm_count).toBe(1);
    expect(result.alarm_rows[0]).toMatchObject({
      id: 'alarm-1',
      alarm_config_id: 'config-1',
      name: 'Temperature alarm',
      description: 'Temperature exceeded the threshold',
      content: '42 C',
      alarm_time: '2024-03-18T17:06:17.658Z',
      processing_result: 'UND',
      tenant_id: 'tenant-1',
      remark: 'keep this field',
      title: 'Temperature alarm',
      detail: 'Temperature exceeded the threshold',
      source: 'user-1',
      status: 'UND',
      level: 'info',
    });
    expect(result.alarm_rows[0].time).not.toBe('');
    expect(result.latest_alarm).toEqual(result.alarm_rows[0]);
    expect(result.latest_alarm_title).toBe('Temperature alarm');
  });

  it('uses the device alarm endpoint for device alarm history bindings', () => {
    const source = thingspanelCatalog.dataSources.find(
      (item) => item.id === 'thingspanel_current_device_alarm_history',
    );

    expect(source?.url).toBe('{{ var.platformApiBaseUrl }}/alarm/info/history/device');
  });

  it('maps device alarm status responses without list rows', () => {
    expect(
      runTransformation('thingspanel_current_device_alarm_history', {
        data: { alarm: false },
      }),
    ).toMatchObject({
      device_alarm_active: false,
      device_alarm_rows: [],
      device_alarm_total: 0,
    });

    expect(
      runTransformation('thingspanel_current_device_alarm_history', {
        data: { alarm: true },
      }),
    ).toMatchObject({
      device_alarm_active: true,
      device_alarm_rows: [],
      device_alarm_total: 1,
    });
  });
});
