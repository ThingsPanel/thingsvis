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
