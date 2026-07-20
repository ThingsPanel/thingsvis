import { create } from 'zustand';

// =============================================================================
// Platform Device Store
// =============================================================================

export interface PlatformDeviceField {
  id: string;
  name: string;
  alias?: string;
  type?: 'number' | 'string' | 'boolean' | 'json' | string;
  dataType?: 'attribute' | 'telemetry' | 'command' | 'event' | string;
  unit?: string;
  description?: string;
  jsonSchema?: Record<string, string>;
  [key: string]: unknown;
}

export interface PlatformDevicePreset {
  id: string;
  name: string;
  thumbnail?: string;
  widget?: Record<string, unknown>; // Legacy single-node snippet
  schema?: {
    canvas?: Record<string, unknown>;
    nodes: Record<string, unknown>[];
    dataSources?: unknown[];
  };
}

export interface PlatformDeviceGroup {
  groupId: string;
  groupName: string;
  deviceCount?: number;
  parentId?: string | null;
}

export interface PlatformDevice {
  deviceId: string;
  deviceName: string;
  groupId?: string;
  groupName?: string;
  deviceConfigId?: string;
  deviceConfigName?: string;
  isOnline?: number | string | boolean;
  warnStatus?: string;
  deviceType?: string;
  accessWay?: string;
  protocolType?: string;
  lastPushTime?: string;
  templateId?: string;
  fields?: PlatformDeviceField[];
  presets?: PlatformDevicePreset[];
}

interface PlatformDeviceState {
  /** Lightweight group metadata provided by the host for lazy device loading */
  groups: PlatformDeviceGroup[];

  /** Group ids that have already fetched their device list from the host */
  loadedGroupIds: string[];

  /** List of devices and their presets provided by the host */
  devices: PlatformDevice[];

  /** Completely replace the group definitions */
  setGroups: (groups: PlatformDeviceGroup[]) => void;

  /** Completely replace the device definitions */
  setDevices: (devices: PlatformDevice[]) => void;

  /** Replace devices belonging to one group and mark the group as loaded */
  setDevicesForGroup: (groupId: string, devices: PlatformDevice[]) => void;

  /** Merge field definitions into one device */
  updateDeviceFields: (deviceId: string, fields: PlatformDeviceField[]) => void;

  /** Clear all devices */
  clearDevices: () => void;
}

function normalizeGroupId(groupId?: string, groupName?: string): string {
  return String(groupId || groupName || '__ungrouped__').trim() || '__ungrouped__';
}

function normalizeGroupName(groupName?: string, groupId?: string): string {
  return String(groupName || groupId || 'Ungrouped').trim() || 'Ungrouped';
}

function normalizeGroups(groups: PlatformDeviceGroup[]): PlatformDeviceGroup[] {
  const deduped = new Map<string, PlatformDeviceGroup>();

  groups.forEach((group) => {
    const groupId = normalizeGroupId(group.groupId, group.groupName);
    deduped.set(groupId, {
      groupId,
      groupName: normalizeGroupName(group.groupName, groupId),
      ...(typeof group.deviceCount === 'number' ? { deviceCount: group.deviceCount } : {}),
      ...(group.parentId !== undefined ? { parentId: group.parentId } : {}),
    });
  });

  return Array.from(deduped.values()).sort((a, b) => a.groupName.localeCompare(b.groupName));
}

function areGroupsEqual(left: PlatformDeviceGroup[], right: PlatformDeviceGroup[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((group, index) => {
    const other = right[index];
    if (!other) return false;
    return (
      group.groupId === other.groupId &&
      group.groupName === other.groupName &&
      group.deviceCount === other.deviceCount &&
      group.parentId === other.parentId
    );
  });
}

function normalizeDevices(devices: PlatformDevice[]): PlatformDevice[] {
  return devices.map((device) => {
    const groupId = normalizeGroupId(device.groupId, device.groupName);
    return {
      ...device,
      groupId,
      groupName: normalizeGroupName(device.groupName, groupId),
    };
  });
}

function hasFields(device: PlatformDevice | undefined): boolean {
  return Array.isArray(device?.fields) && device.fields.length > 0;
}

function mergeDeviceMetadata(
  nextDevice: PlatformDevice,
  existingDevice: PlatformDevice | undefined,
): PlatformDevice {
  if (!existingDevice) return nextDevice;

  return {
    ...existingDevice,
    ...nextDevice,
    templateId: nextDevice.templateId ?? existingDevice.templateId,
    deviceConfigId: nextDevice.deviceConfigId ?? existingDevice.deviceConfigId,
    deviceConfigName: nextDevice.deviceConfigName ?? existingDevice.deviceConfigName,
    presets: Array.isArray(nextDevice.presets) ? nextDevice.presets : existingDevice.presets,
    fields: hasFields(nextDevice) ? nextDevice.fields : existingDevice.fields,
  };
}

function mergeDevicesWithExisting(
  devices: PlatformDevice[],
  existingDevices: PlatformDevice[],
): PlatformDevice[] {
  const existingById = new Map(existingDevices.map((device) => [device.deviceId, device]));
  return normalizeDevices(devices).map((device) =>
    mergeDeviceMetadata(device, existingById.get(device.deviceId)),
  );
}

function deriveGroupsFromDevices(devices: PlatformDevice[]): PlatformDeviceGroup[] {
  const groups: PlatformDeviceGroup[] = devices.map((device) => {
    const groupId = normalizeGroupId(device.groupId, device.groupName);
    return {
      groupId,
      groupName: normalizeGroupName(device.groupName, groupId),
    };
  });

  return normalizeGroups(groups);
}

export const usePlatformDeviceStore = create<PlatformDeviceState>((set) => ({
  groups: [],
  loadedGroupIds: [],
  devices: [],

  setGroups: (groups) =>
    set((state) => {
      const normalizedGroups = normalizeGroups(groups);
      if (areGroupsEqual(normalizedGroups, state.groups)) return state;

      const validGroupIds = new Set(normalizedGroups.map((group) => group.groupId));
      const retainedLoadedGroupIds = state.loadedGroupIds.filter((groupId) =>
        validGroupIds.has(normalizeGroupId(groupId)),
      );

      return {
        groups: normalizedGroups,
        devices: state.devices,
        loadedGroupIds: retainedLoadedGroupIds,
      };
    }),

  setDevices: (devices) => {
    const normalizedDevices = normalizeDevices(devices);
    const derivedGroups = deriveGroupsFromDevices(normalizedDevices);
    set((state) => {
      const mergedDevices = mergeDevicesWithExisting(normalizedDevices, state.devices);
      const mergedGroups = normalizeGroups([...state.groups, ...derivedGroups]);
      return {
        groups: mergedGroups,
        devices: mergedDevices,
        loadedGroupIds: Array.from(
          new Set([...state.loadedGroupIds, ...derivedGroups.map((group) => group.groupId)]),
        ),
      };
    });
  },

  setDevicesForGroup: (groupId, devices) => {
    const normalizedGroupId = normalizeGroupId(groupId);

    set((state) => {
      const normalizedDevices = mergeDevicesWithExisting(
        devices.map((device) => ({
          ...device,
          groupId: device.groupId || normalizedGroupId,
        })),
        state.devices,
      );
      const retainedDevices = state.devices.filter(
        (device) => normalizeGroupId(device.groupId, device.groupName) !== normalizedGroupId,
      );
      const mergedGroups = normalizeGroups([
        ...state.groups,
        ...deriveGroupsFromDevices(normalizedDevices),
      ]);

      return {
        groups: mergedGroups,
        devices: [...retainedDevices, ...normalizedDevices],
        loadedGroupIds: Array.from(new Set([...state.loadedGroupIds, normalizedGroupId])),
      };
    });
  },

  updateDeviceFields: (deviceId, fields) =>
    set((state) => {
      const deviceIndex = state.devices.findIndex((device) => device.deviceId === deviceId);
      if (deviceIndex < 0) return state;

      const currentDevice = state.devices[deviceIndex];
      if (!currentDevice) return state;
      const currentFields = currentDevice.fields ?? [];
      const fieldsUnchanged =
        currentFields.length === fields.length &&
        currentFields.every((field, index) => {
          const nextField = fields[index];
          return (
            nextField !== undefined &&
            field.id === nextField.id &&
            field.name === nextField.name &&
            field.type === nextField.type &&
            field.dataType === nextField.dataType
          );
        });
      if (fieldsUnchanged) return state;

      const devices = [...state.devices];
      devices[deviceIndex] = { ...currentDevice, fields };
      return { devices };
    }),

  clearDevices: () => set({ groups: [], loadedGroupIds: [], devices: [] }),
}));

/**
 * Non-React helper for accessing/mutating devices from outside component trees.
 */
export const platformDeviceStore = {
  getGroups: () => usePlatformDeviceStore.getState().groups,
  setGroups: (groups: PlatformDeviceGroup[]) => usePlatformDeviceStore.getState().setGroups(groups),
  getLoadedGroupIds: () => usePlatformDeviceStore.getState().loadedGroupIds,
  getDevices: () => usePlatformDeviceStore.getState().devices,
  setDevices: (devices: PlatformDevice[]) => usePlatformDeviceStore.getState().setDevices(devices),
  setDevicesForGroup: (groupId: string, devices: PlatformDevice[]) =>
    usePlatformDeviceStore.getState().setDevicesForGroup(groupId, devices),
  updateDeviceFields: (deviceId: string, fields: PlatformDeviceField[]) =>
    usePlatformDeviceStore.getState().updateDeviceFields(deviceId, fields),
  clearDevices: () => usePlatformDeviceStore.getState().clearDevices(),
};
