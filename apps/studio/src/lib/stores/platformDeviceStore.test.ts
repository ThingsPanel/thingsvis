import { afterEach, describe, expect, it } from 'vitest';
import { platformDeviceStore } from './platformDeviceStore';

afterEach(() => {
  platformDeviceStore.clearDevices();
});

describe('platformDeviceStore', () => {
  it('preserves loaded field metadata when groups are refreshed', () => {
    platformDeviceStore.setDevices([
      {
        deviceId: 'dev-1',
        deviceName: 'Device 1',
        groupId: 'group-a',
        fields: [{ id: 'supplyPressure', name: 'Supply pressure', type: 'number' }],
      },
    ]);

    platformDeviceStore.setGroups([{ groupId: 'group-b', groupName: 'Group B' }]);

    expect(platformDeviceStore.getDevices()[0]?.fields).toEqual([
      { id: 'supplyPressure', name: 'Supply pressure', type: 'number' },
    ]);
  });

  it('preserves loaded field metadata when device summaries are refreshed', () => {
    platformDeviceStore.setDevices([
      {
        deviceId: 'dev-1',
        deviceName: 'Device 1',
        groupId: 'group-a',
        deviceConfigId: 'config-1',
        fields: [{ id: 'returnTemp', name: 'Return temperature', type: 'number' }],
      },
    ]);

    platformDeviceStore.setDevices([
      {
        deviceId: 'dev-1',
        deviceName: 'Device 1 renamed',
        groupId: 'group-a',
      },
    ]);

    const [device] = platformDeviceStore.getDevices();
    expect(device?.deviceName).toBe('Device 1 renamed');
    expect(device?.deviceConfigId).toBe('config-1');
    expect(device?.fields).toEqual([
      { id: 'returnTemp', name: 'Return temperature', type: 'number' },
    ]);
  });

  it('preserves loaded field metadata when a group page is refreshed', () => {
    platformDeviceStore.setDevicesForGroup('group-a', [
      {
        deviceId: 'dev-1',
        deviceName: 'Device 1',
        fields: [{ id: 'totalHeat', name: 'Total heat', type: 'number' }],
      },
    ]);

    platformDeviceStore.setDevicesForGroup('group-a', [
      {
        deviceId: 'dev-1',
        deviceName: 'Device 1',
      },
    ]);

    expect(platformDeviceStore.getDevices()[0]?.fields).toEqual([
      { id: 'totalHeat', name: 'Total heat', type: 'number' },
    ]);
  });
});
