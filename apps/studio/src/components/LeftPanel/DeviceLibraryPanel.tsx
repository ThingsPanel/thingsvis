import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Server, Search, CheckCircle2, AlertCircle, Box } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

import {
  usePlatformDeviceStore,
  type PlatformDevice,
  type PlatformDevicePreset,
} from '@/lib/stores/platformDeviceStore';

export default function DeviceLibraryPanel() {
  const { t } = useTranslation('editor');
  const [searchQuery, setSearchQuery] = useState('');

  // Read the devices from the store
  const devices = usePlatformDeviceStore((state) => state.devices);

  // Filter devices/presets based on search query
  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return devices;
    const query = searchQuery.toLowerCase();

    return devices
      .map((device) => {
        // If device name matches, keep all its presets
        if (device.deviceName.toLowerCase().includes(query)) {
          return device;
        }
        // Otherwise filter its presets
        const matchedPresets = (device.presets || []).filter((preset) =>
          preset.name.toLowerCase().includes(query),
        );
        if (matchedPresets.length > 0) {
          return { ...device, presets: matchedPresets };
        }
        return null;
      })
      .filter(Boolean) as PlatformDevice[];
  }, [searchQuery, devices]);

  // Handle dragging a preset out of the library
  const handleDragStart = (
    e: React.DragEvent,
    device: PlatformDevice,
    preset: PlatformDevicePreset,
  ) => {
    try {
      // 1. Clone the widget JSON
      const widgetStr = JSON.stringify(preset.widget);

      // 2. Perform variable substitution for this specific device
      // The preset JSON should use ^{{ ds.__platform___deviceId___.data.xxx }} as convention,
      // or we can just replace a generic placeholder like __DEVICE_ID__ depending on host convention.
      // Here we replace the generic ds.__platform__.data with ds.__platform_{deviceId}__.data
      const resolvedStr = widgetStr.replace(
        /ds\.__platform__\.data/g,
        `ds.__platform_${device.deviceId}__.data`,
      );

      // payload type 'thingsvis-widget-snippet' signals the canvas it's a pre-configured node JSON
      e.dataTransfer.setData('application/thingsvis-widget-snippet', resolvedStr);
      e.dataTransfer.effectAllowed = 'copy';
    } catch (err) {
      console.error('Failed to serialize widget preset', err);
    }
  };

  if (!devices || devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground gap-3">
        <Server className="w-12 h-12 opacity-20" />
        <p className="text-sm">暂无设备或设备未配置组件预设</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-2 pb-3 border-b border-border">
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

      {/* Devices List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredDevices.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t('components.noResults', '无匹配结果')}
          </div>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={devices.map((d) => d.deviceId)}
            className="space-y-2"
          >
            {filteredDevices.map((device) => (
              <AccordionItem key={device.deviceId} value={device.deviceId} className="border-0">
                <AccordionTrigger className="px-2 py-1.5 hover:bg-accent rounded-md text-sm font-semibold hover:no-underline text-left">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" />
                    <span className="truncate">{device.deviceName}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-1 px-2">
                  {!device.presets || device.presets.length === 0 ? (
                    <div className="text-xs text-muted-foreground px-2 py-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      未配置预设组件
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {device.presets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            draggable
                            onDragStart={(e) => handleDragStart(e, device, preset)}
                            className="h-20 rounded border border-border hover:border-primary hover:bg-accent flex flex-col items-center justify-center gap-2 transition-colors p-2"
                            title={preset.name}
                          >
                            <div className="h-8 w-8 text-foreground flex items-center justify-center bg-background rounded border border-border/50 shadow-sm">
                              {preset.thumbnail ? (
                                <img
                                  src={preset.thumbnail}
                                  alt={preset.name}
                                  className="max-w-full max-h-full object-contain"
                                />
                              ) : (
                                <Box className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="leading-tight text-center w-full">
                              <div className="text-xs text-foreground font-medium truncate px-0.5">
                                {preset.name}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
