import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Server, Search, AlertCircle, Box } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import {
  usePlatformDeviceStore,
  type PlatformDevice,
  type PlatformDeviceGroup,
  type PlatformDevicePreset,
} from '@/lib/stores/platformDeviceStore';
import { hydrateDevicePresetSchema, hydrateDevicePresetWidget } from '@/lib/devicePresetHydration';
import { DeviceSelectorModal } from '@/components/RightPanel/DeviceSelectorModal';
import {
  ensureRegistryLoaded,
  getRegistrySnapshot,
  subscribeRegistry,
} from '@/lib/registry/registry-store';
import { ICON_MAP } from './ComponentsList';

export default function DeviceLibraryPanel() {
  const { t } = useTranslation('editor');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<PlatformDevice | null>(null);
  const [deviceSelectorOpen, setDeviceSelectorOpen] = useState(false);
  const groupsRequested = true;
  const registrySnapshot = useSyncExternalStore(
    subscribeRegistry,
    getRegistrySnapshot,
    getRegistrySnapshot,
  );

  // Read the devices from the store
  const groups = usePlatformDeviceStore((state) => state.groups);
  const devices = usePlatformDeviceStore((state) => state.devices);

  useEffect(() => {
    ensureRegistryLoaded().catch((error) => {
      console.error('[DeviceLibraryPanel] Failed to load component registry', error);
    });
  }, []);

  const selectedDeviceSource = useMemo(
    () => devices.find((device) => device.deviceId === selectedDeviceId) ?? selectedDevice,
    [devices, selectedDevice, selectedDeviceId],
  );

  const visiblePresets = useMemo(() => {
    const presets = Array.isArray(selectedDeviceSource?.presets)
      ? selectedDeviceSource.presets
      : [];
    if (!searchQuery.trim()) return presets;
    const query = searchQuery.toLowerCase();

    return presets.filter((preset) => preset.name.toLowerCase().includes(query));
  }, [searchQuery, selectedDeviceSource]);

  const registryEntryByType = useMemo(() => {
    const map = new Map<string, NonNullable<typeof registrySnapshot>['entries'][number]>();
    (registrySnapshot?.entries ?? []).forEach((entry) => {
      map.set(entry.componentId, entry);
    });
    return map;
  }, [registrySnapshot]);

  const handleDevicesLoaded = React.useCallback(
    (_groupId: string, nextDevices: PlatformDevice[]) => {
      usePlatformDeviceStore.getState().setDevices(nextDevices);
    },
    [],
  );

  const handleDeviceGroupsLoaded = React.useCallback((nextGroups: PlatformDeviceGroup[]) => {
    usePlatformDeviceStore.getState().setGroups(nextGroups);
  }, []);

  const handleDeviceSelect = React.useCallback((device: PlatformDevice) => {
    setSelectedDevice(device);
    setSelectedDeviceId(device.deviceId);
    setDeviceSelectorOpen(false);
    usePlatformDeviceStore.getState().setDevices([device]);
  }, []);

  // Handle dragging a preset out of the library
  const handleDragStart = (
    e: React.DragEvent,
    device: PlatformDevice,
    preset: PlatformDevicePreset,
  ) => {
    try {
      const resolvedPayload =
        preset.schema && Array.isArray(preset.schema.nodes) && preset.schema.nodes.length > 0
          ? {
              kind: 'thingsvis-preset-schema',
              presetId: preset.id,
              name: preset.name,
              schema: hydrateDevicePresetSchema(preset.schema, device.deviceId),
            }
          : hydrateDevicePresetWidget(
              (preset.widget ?? {}) as Record<string, unknown>,
              device.deviceId,
            );

      const resolvedStr = JSON.stringify(resolvedPayload);

      // payload type 'thingsvis-widget-snippet' signals the canvas it's a pre-configured node JSON
      e.dataTransfer.setData('application/thingsvis-widget-snippet', resolvedStr);
      e.dataTransfer.setData('text/plain', resolvedStr);
      e.dataTransfer.effectAllowed = 'copy';
    } catch (err) {
      console.error('Failed to serialize widget preset', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 pb-3 border-b border-border space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">设备</label>
          <Button
            type="button"
            variant="outline"
            className="h-8 w-full justify-start overflow-hidden px-3"
            onClick={() => setDeviceSelectorOpen(true)}
          >
            <span className="truncate">{selectedDeviceSource?.deviceName || '选择设备'}</span>
          </Button>
          <DeviceSelectorModal
            open={deviceSelectorOpen}
            onOpenChange={setDeviceSelectorOpen}
            groups={groups}
            selectedGroupId={selectedGroupId}
            selectedDeviceId={selectedDeviceSource?.deviceId}
            onGroupChange={setSelectedGroupId}
            onGroupsLoaded={handleDeviceGroupsLoaded}
            onDevicesLoaded={handleDevicesLoaded}
            onSelect={handleDeviceSelect}
          />
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('components.searchPlaceholder', '搜索设备或组件...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {!selectedDeviceSource ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-muted-foreground">
            <Server className="h-10 w-10 opacity-20" />
            <p className="text-sm">
              {groupsRequested ? '请选择设备' : t('common.loadingData', 'Loading data...')}
            </p>
          </div>
        ) : visiblePresets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 opacity-30" />
            <p className="text-sm">
              {Array.isArray(selectedDeviceSource.presets) &&
              selectedDeviceSource.presets.length > 0
                ? t('components.noResults', '无匹配结果')
                : '该设备模板未配置 Web 图表组件预设'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1 text-sm font-semibold">
              <Server className="h-4 w-4 text-primary" />
              <span className="truncate">{selectedDeviceSource.deviceName}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {visiblePresets.map((preset) =>
                (() => {
                  const componentType =
                    typeof preset.widget?.type === 'string' ? preset.widget.type : '';
                  const registryEntry = componentType
                    ? registryEntryByType.get(componentType)
                    : null;
                  const iconName = registryEntry?.icon ?? '';
                  const IconComponent = (iconName && ICON_MAP[iconName]) || Box;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      draggable
                      onDragStart={(e) => handleDragStart(e, selectedDeviceSource, preset)}
                      className="flex h-20 flex-col items-center justify-center gap-2 rounded border border-border p-2 transition-colors hover:border-primary hover:bg-accent"
                      title={preset.name}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded border border-border/50 bg-background text-foreground shadow-sm">
                        {registryEntry?.iconUrl ? (
                          <img
                            src={registryEntry.iconUrl}
                            alt={preset.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : preset.thumbnail ? (
                          <img
                            src={preset.thumbnail}
                            alt={preset.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="w-full text-center leading-tight">
                        <div className="truncate px-0.5 text-xs font-medium text-foreground">
                          {preset.name}
                        </div>
                      </div>
                    </button>
                  );
                })(),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
