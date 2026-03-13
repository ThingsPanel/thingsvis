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
  widget: Record<string, unknown>; // The actual node JSON snippet
}

export interface PlatformDevice {
  deviceId: string;
  deviceName: string;
  groupName?: string;
  templateId?: string;
  fields?: PlatformDeviceField[];
  presets?: PlatformDevicePreset[];
}

interface PlatformDeviceState {
  /** List of devices and their presets provided by the host */
  devices: PlatformDevice[];

  /** Completely replace the device definitions */
  setDevices: (devices: PlatformDevice[]) => void;

  /** Merge field definitions into one device */
  updateDeviceFields: (deviceId: string, fields: PlatformDeviceField[]) => void;

  /** Clear all devices */
  clearDevices: () => void;
}

export const usePlatformDeviceStore = create<PlatformDeviceState>((set) => ({
  devices: [],

  setDevices: (devices) => set({ devices }),

  updateDeviceFields: (deviceId, fields) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.deviceId === deviceId ? { ...device, fields } : device,
      ),
    })),

  clearDevices: () => set({ devices: [] }),
}));

/**
 * Non-React helper for accessing/mutating devices from outside component trees.
 */
export const platformDeviceStore = {
  getDevices: () => usePlatformDeviceStore.getState().devices,
  setDevices: (devices: PlatformDevice[]) => usePlatformDeviceStore.getState().setDevices(devices),
  updateDeviceFields: (deviceId: string, fields: PlatformDeviceField[]) =>
    usePlatformDeviceStore.getState().updateDeviceFields(deviceId, fields),
  clearDevices: () => usePlatformDeviceStore.getState().clearDevices(),
};
