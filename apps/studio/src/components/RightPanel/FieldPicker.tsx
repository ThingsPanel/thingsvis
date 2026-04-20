import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine } from 'lucide-react';
import type { KernelStore } from '@thingsvis/kernel';
import { useDataSourceRegistry } from '@thingsvis/ui';
import { DEFAULT_PLATFORM_FIELD_CONFIG } from '@thingsvis/schema';
import { dataSourceManager } from '@/lib/store';
import { usePlatformDeviceStore } from '@/lib/stores/platformDeviceStore';
import { resolveEditorServiceConfig } from '@/lib/embedded/service-config';
import { resolveEmbeddedProviderCatalog } from '@/lib/embedded/embedded-data-source-registry';
import { resolveControlText } from '@/lib/i18n/controlText';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { listFieldPaths, resolveFieldPath, type FieldPathInfo } from './fieldPath';

export type FieldPickerValue = {
  dataSourceId: string;
  fieldPath: string;
  transform?: string;
};

type SourceGroup = 'device' | 'platform' | 'custom';

const TEMPLATE_DEVICE_ID = '__template__';

type PlatformStatField = {
  id: string;
  name: string;
  type: FieldPathInfo['type'];
};

type PlatformStatSource = {
  id: string;
  name: string;
  group: 'dashboard' | 'current-device' | 'current-device-history';
  url: string;
  params?: Record<string, unknown>;
  fields: PlatformStatField[];
  transformation: string;
};

type RuntimeDeviceField = {
  id: string;
  name: string;
  alias: string;
  type: FieldPathInfo['type'];
};

type Props = {
  kernelStore: KernelStore;
  value: FieldPickerValue | null;
  onChange: (next: FieldPickerValue | null) => void;
  maxDepth?: number;
  maxNodes?: number;
};

/** Safely evaluate a transform snippet against a value and full DS snapshot. Returns undefined on error. */
function applyTransform(
  transformCode: string,
  value: unknown,
  data?: unknown,
): { ok: boolean; result: unknown } {
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('value', 'data', `"use strict"; return (${transformCode.trim()});`);
    return { ok: true, result: fn(value, data) };
  } catch {
    return { ok: false, result: undefined };
  }
}

function formatPreview(val: unknown): string {
  if (val === undefined || val === null) return 'null';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val).slice(0, 80);
    } catch {
      return '[object]';
    }
  }
  return String(val).slice(0, 80);
}

function getDeviceDataSourceId(deviceId: string): string {
  return `__platform_${deviceId}__`;
}

function parseDeviceDataSourceId(dataSourceId: string): string | null {
  const match = /^__platform_(.+)__$/.exec(dataSourceId);
  return match?.[1] ?? null;
}

function getRequestedFieldId(fieldPath: string): string | null {
  if (!fieldPath || fieldPath === '(root)') return null;
  return fieldPath.split(/[.[\]]/).filter(Boolean)[0] ?? null;
}

function isTemplateDeviceSource(device: { deviceId?: string } | undefined): boolean {
  return device?.deviceId === TEMPLATE_DEVICE_ID;
}

function ensurePlatformDeviceDataSource(device: { deviceId: string; deviceName?: string }): void {
  const dataSourceId = getDeviceDataSourceId(device.deviceId);
  const existing = dataSourceManager.getAllConfigs().some((config) => config.id === dataSourceId);
  if (existing) return;

  const inheritedBufferSize = Math.max(
    0,
    ...dataSourceManager
      .getAllConfigs()
      .filter((config) => parseDeviceDataSourceId(config.id) !== null)
      .map((config) => {
        const bufferSize = (config.config as { bufferSize?: unknown } | undefined)?.bufferSize;
        return typeof bufferSize === 'number' && Number.isFinite(bufferSize) ? bufferSize : 0;
      }),
  );

  dataSourceManager.registerDataSource({
    id: dataSourceId,
    name: device.deviceName || `Device ${device.deviceId}`,
    type: 'PLATFORM_FIELD',
    config: {
      ...DEFAULT_PLATFORM_FIELD_CONFIG,
      source: 'platform',
      deviceId: device.deviceId,
      bufferSize: inheritedBufferSize,
      requestedFields: [],
    },
  });
}

function ensurePlatformStatDataSource(source: PlatformStatSource): void {
  const existing = dataSourceManager.getAllConfigs().some((config) => config.id === source.id);
  if (existing) return;

  void dataSourceManager
    .registerDataSource(
      {
        id: source.id,
        name: source.name,
        type: 'REST',
        config: {
          url: source.url,
          method: 'GET',
          headers: {
            'x-token': '{{ var.platformToken }}',
          },
          params: source.params ?? {},
          pollingInterval: 60,
          timeout: 30,
          auth: { type: 'none' },
        },
        transformation: source.transformation,
      },
      false,
    )
    .catch((error) => {
      console.error(
        '[FieldPicker] Failed to register platform statistics source:',
        source.id,
        error,
      );
    });
}

export function FieldPicker({ kernelStore, value, onChange, maxDepth, maxNodes }: Props) {
  const { t, i18n } = useTranslation('editor');
  const { states } = useDataSourceRegistry(kernelStore);
  const dataSourceIds = useMemo(() => Object.keys(states).sort(), [states]);
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const serviceConfig = useMemo(() => resolveEditorServiceConfig(), []);
  const isEmbeddedMode = serviceConfig.mode === 'embedded';
  const providerCatalog = useMemo(
    () => (isEmbeddedMode ? resolveEmbeddedProviderCatalog(serviceConfig.provider) : undefined),
    [isEmbeddedMode, serviceConfig.provider],
  );
  const platformSources = useMemo<PlatformStatSource[]>(
    () =>
      (providerCatalog?.dataSources ?? []).map((source) => ({
        id: source.id,
        name: resolveControlText(source.label, locale, t),
        group: source.group,
        url: source.url,
        params: source.params,
        transformation: source.transformation,
        fields: source.fields.map((field) => ({
          id: field.id,
          name: resolveControlText(field.label, locale, t),
          type: field.type as FieldPathInfo['type'],
        })),
      })),
    [locale, providerCatalog, t],
  );
  const platformSourceIds = useMemo(
    () => new Set(platformSources.map((source) => source.id)),
    [platformSources],
  );
  const runtimeDeviceFields = useMemo<RuntimeDeviceField[]>(
    () =>
      (providerCatalog?.runtimeDeviceFields ?? []).map((field) => ({
        id: field.id,
        name: resolveControlText(field.label, locale, t),
        alias: resolveControlText(field.alias ?? field.label, locale, t),
        type: field.type as FieldPathInfo['type'],
      })),
    [locale, providerCatalog, t],
  );
  const platformSourcesByGroup = useMemo(
    () => ({
      dashboard: platformSources.filter((source) => source.group === 'dashboard'),
      currentDevice: platformSources.filter((source) => source.group === 'current-device'),
      currentDeviceHistory: platformSources.filter(
        (source) => source.group === 'current-device-history',
      ),
    }),
    [platformSources],
  );

  // 🆕 平台字段（嵌入模式）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const platformDeviceGroups = usePlatformDeviceStore((s) => s.groups ?? []);
  const loadedGroupIds = usePlatformDeviceStore((s) => s.loadedGroupIds ?? []);
  const platformDevices = usePlatformDeviceStore((s) => s.devices ?? []);

  const [transformDialogOpen, setTransformDialogOpen] = useState(false);
  /** Draft code while the dialog is open — only committed on Apply */
  const [draftCode, setDraftCode] = useState('');

  const selectedDataSourceId = value?.dataSourceId || '';
  const selectedFieldPath = value?.fieldPath || '';
  const selectedTransform = value?.transform || '';
  const [embeddedSourceGroup, setEmbeddedSourceGroup] = useState<SourceGroup>('device');
  const [selectedDeviceGroupIdState, setSelectedDeviceGroupIdState] = useState('');

  const deviceSources = useMemo(() => {
    const fromStore = platformDevices.map((device) => ({
      deviceId: device.deviceId,
      label: device.deviceName || `Device ${device.deviceId}`,
      groupId: device.groupId || device.groupName || '__ungrouped__',
      groupName: device.groupName || t('binding.deviceFields', 'Device Fields'),
      templateId: device.templateId,
      dataSourceId: getDeviceDataSourceId(device.deviceId),
      fields: device.fields ?? [],
    }));

    const knownDeviceIds = new Set(fromStore.map((item) => item.dataSourceId));
    const inferred = dataSourceIds
      .filter((id) => parseDeviceDataSourceId(id))
      .filter((id) => !knownDeviceIds.has(id))
      .map((id) => {
        const deviceId = parseDeviceDataSourceId(id) as string;
        return {
          deviceId,
          label: `Device ${deviceId}`,
          groupId: '__ungrouped__',
          groupName: t('binding.deviceFields', 'Device Fields'),
          templateId: undefined,
          dataSourceId: id,
          fields: [],
        };
      });

    return [...fromStore, ...inferred].sort((a, b) => a.label.localeCompare(b.label));
  }, [platformDevices, dataSourceIds, t]);

  const customDataSourceIds = useMemo(
    () =>
      dataSourceIds.filter(
        (id) =>
          id !== '__platform__' &&
          parseDeviceDataSourceId(id) === null &&
          !platformSourceIds.has(id),
      ),
    [dataSourceIds, platformSourceIds],
  );
  const hasPlatformStatsCatalog = isEmbeddedMode && platformSources.length > 0;
  const hasDeviceCatalog = platformDeviceGroups.length > 0 || deviceSources.length > 0;
  const hasTemplateFieldCatalog =
    isEmbeddedMode &&
    platformDeviceGroups.length === 0 &&
    deviceSources.length === 1 &&
    isTemplateDeviceSource(deviceSources[0]);
  const deviceGroupOptions = useMemo(() => {
    if (platformDeviceGroups.length > 0) return platformDeviceGroups;

    const deduped = new Map<string, { groupId: string; groupName: string }>();
    deviceSources.forEach((device) => {
      if (!deduped.has(device.groupId)) {
        deduped.set(device.groupId, {
          groupId: device.groupId,
          groupName: device.groupName,
        });
      }
    });
    return Array.from(deduped.values());
  }, [deviceSources, platformDeviceGroups]);

  useEffect(() => {
    if (!isEmbeddedMode) return;

    if (selectedDataSourceId && parseDeviceDataSourceId(selectedDataSourceId)) {
      setEmbeddedSourceGroup('device');
      const selectedDevice = deviceSources.find(
        (device) => device.dataSourceId === selectedDataSourceId,
      );
      if (selectedDevice?.groupId) {
        setSelectedDeviceGroupIdState(selectedDevice.groupId);
      }
      return;
    }

    if (selectedDataSourceId && platformSourceIds.has(selectedDataSourceId)) {
      setEmbeddedSourceGroup('platform');
      return;
    }

    if (selectedDataSourceId) {
      setEmbeddedSourceGroup('custom');
      return;
    }

    setEmbeddedSourceGroup(
      hasDeviceCatalog ? 'device' : hasPlatformStatsCatalog ? 'platform' : 'custom',
    );
  }, [
    deviceSources,
    hasDeviceCatalog,
    hasPlatformStatsCatalog,
    isEmbeddedMode,
    platformSourceIds,
    selectedDataSourceId,
  ]);

  useEffect(() => {
    if (!isEmbeddedMode || embeddedSourceGroup !== 'platform') return;
    platformSources.forEach(ensurePlatformStatDataSource);
  }, [embeddedSourceGroup, isEmbeddedMode, platformSources]);

  useEffect(() => {
    if (!isEmbeddedMode || embeddedSourceGroup !== 'device') return;

    if (platformDeviceGroups.length > 0) {
      if (
        !selectedDeviceGroupIdState ||
        !deviceGroupOptions.some((group) => group.groupId === selectedDeviceGroupIdState)
      ) {
        setSelectedDeviceGroupIdState(String(deviceGroupOptions[0]?.groupId || ''));
      }
      return;
    }

    if (!selectedDeviceGroupIdState && deviceSources[0]?.groupId) {
      setSelectedDeviceGroupIdState(deviceSources[0].groupId);
    }
  }, [
    deviceGroupOptions,
    deviceSources,
    embeddedSourceGroup,
    isEmbeddedMode,
    platformDeviceGroups.length,
    selectedDeviceGroupIdState,
  ]);

  const selectedGroup = isEmbeddedMode ? embeddedSourceGroup : 'custom';
  const selectedDeviceFromValue =
    selectedGroup === 'device'
      ? deviceSources.find((device) => device.dataSourceId === selectedDataSourceId)
      : undefined;
  const selectedDeviceGroupId =
    selectedGroup === 'device'
      ? selectedDeviceFromValue?.groupId ||
        selectedDeviceGroupIdState ||
        String(deviceGroupOptions[0]?.groupId || deviceSources[0]?.groupId || '')
      : '';
  const visibleDeviceSources = useMemo(
    () =>
      selectedGroup === 'device'
        ? deviceSources.filter((device) => device.groupId === selectedDeviceGroupId)
        : [],
    [deviceSources, selectedDeviceGroupId, selectedGroup],
  );
  const isSelectedDeviceGroupLoaded =
    selectedGroup === 'device' &&
    selectedDeviceGroupId.length > 0 &&
    (loadedGroupIds.includes(selectedDeviceGroupId) || window.parent === window);

  const selectedDeviceSource =
    selectedGroup === 'device'
      ? visibleDeviceSources.find((device) => device.dataSourceId === selectedDataSourceId) ||
        visibleDeviceSources[0]
      : undefined;
  const isTemplateDeviceSelection =
    hasTemplateFieldCatalog &&
    selectedGroup === 'device' &&
    isTemplateDeviceSource(selectedDeviceSource);

  const selectedDeviceFields = useMemo(() => {
    if (selectedGroup !== 'device') return [];
    const fields = Array.isArray(selectedDeviceSource?.fields)
      ? [...selectedDeviceSource.fields]
      : [];
    const existingIds = new Set(
      fields.map((field: any) => (typeof field?.id === 'string' ? field.id : '')).filter(Boolean),
    );
    runtimeDeviceFields.forEach((field) => {
      if (!existingIds.has(field.id)) {
        fields.push(field as any);
      }
    });
    return fields;
  }, [runtimeDeviceFields, selectedDeviceSource, selectedGroup]);

  const selectedPlatformSource =
    selectedGroup === 'platform'
      ? platformSources.find((source) => source.id === selectedDataSourceId) || platformSources[0]
      : undefined;

  const selectedPlatformFields = useMemo(() => {
    if (selectedGroup !== 'platform') return [];
    return selectedPlatformSource?.fields ?? [];
  }, [selectedPlatformSource, selectedGroup]);
  const hasStaticFieldOptions =
    (selectedGroup === 'device' && selectedDeviceFields.length > 0) ||
    (selectedGroup === 'platform' && selectedPlatformFields.length > 0);
  const fieldDisplayNameByPath = useMemo(() => {
    const labels = new Map<string, string>();
    if (selectedGroup === 'device') {
      selectedDeviceFields.forEach((field: any) => {
        const id = typeof field?.id === 'string' ? field.id : '';
        const label =
          typeof field?.alias === 'string' && field.alias
            ? field.alias
            : typeof field?.name === 'string' && field.name
              ? field.name
              : '';
        if (id && label && label !== id) labels.set(id, label);
      });
    }
    if (selectedGroup === 'platform') {
      selectedPlatformFields.forEach((field) => {
        if (field.name && field.name !== field.id) labels.set(field.id, field.name);
      });
    }
    return labels;
  }, [selectedDeviceFields, selectedGroup, selectedPlatformFields]);

  const effectiveDataSourceId = !isEmbeddedMode
    ? customDataSourceIds.includes(selectedDataSourceId)
      ? selectedDataSourceId
      : (customDataSourceIds[0] ?? '')
    : selectedGroup === 'device'
      ? (selectedDeviceSource?.dataSourceId ?? '')
      : selectedGroup === 'platform'
        ? (selectedPlatformSource?.id ?? '')
        : selectedDataSourceId || customDataSourceIds[0] || '';

  const dsState = effectiveDataSourceId ? states[effectiveDataSourceId] : null;
  const snapshot = dsState?.data ?? null;
  const dsStatus = dsState?.status ?? 'disconnected';
  // fieldSchema — available even when DS is offline (cached from last connection)
  const fieldSchema = (dsState as any)?.fieldSchema ?? null;
  const isOffline = snapshot === null && fieldSchema !== null;
  // Derive field paths for the active data source.
  // Prefer cached fieldSchema (offline-friendly); fall back to static device fields or live snapshot traversal.
  const { paths, pathInfos, truncated } = useMemo(() => {
    if (fieldSchema && fieldSchema.length > 0) {
      const infos: FieldPathInfo[] = fieldSchema.map((e: any) => ({
        path: e.path,
        type: (e.type === 'array'
          ? 'array'
          : e.type === 'number'
            ? 'number'
            : e.type === 'boolean'
              ? 'boolean'
              : e.type === 'object'
                ? 'object'
                : 'string') as FieldPathInfo['type'],
      }));
      return { paths: infos.map((i) => i.path), pathInfos: infos, truncated: false };
    }
    if (selectedGroup === 'device' && selectedDeviceFields.length > 0) {
      const staticInfos: FieldPathInfo[] = [];
      selectedDeviceFields.forEach((f: any) => {
        staticInfos.push({
          path: f.id,
          type: (f.type ?? 'string') as FieldPathInfo['type'],
        });
        if (f.jsonSchema) {
          Object.entries(f.jsonSchema).forEach(([subPath, subType]) => {
            staticInfos.push({
              path: `${f.id}.${subPath}`,
              type: subType as FieldPathInfo['type'],
            });
          });
        }
      });
      return { paths: staticInfos.map((i) => i.path), pathInfos: staticInfos, truncated: false };
    }
    if (selectedGroup === 'platform' && selectedPlatformFields.length > 0) {
      const staticInfos: FieldPathInfo[] = selectedPlatformFields.map((field) => ({
        path: field.id,
        type: field.type as FieldPathInfo['type'],
      }));
      return { paths: staticInfos.map((i) => i.path), pathInfos: staticInfos, truncated: false };
    }
    return listFieldPaths(snapshot, {
      maxDepth: maxDepth ?? 5,
      maxNodes: maxNodes ?? 200,
    });
  }, [
    fieldSchema,
    snapshot,
    maxDepth,
    maxNodes,
    selectedGroup,
    selectedDeviceFields,
    selectedPlatformFields,
  ]);

  // 🆕 当前值预览
  const rawPreviewValue = useMemo(() => {
    if (!selectedFieldPath) return undefined;
    if (!snapshot) return undefined;
    return resolveFieldPath(snapshot, selectedFieldPath);
  }, [snapshot, selectedFieldPath]);

  const previewDisplay = useMemo(() => {
    if (rawPreviewValue === undefined) return null;
    if (selectedTransform.trim()) {
      // Pass full DS snapshot as `data` so the preview matches runtime behaviour
      const { ok, result } = applyTransform(selectedTransform, rawPreviewValue, snapshot);
      return {
        raw: formatPreview(rawPreviewValue),
        transformed: ok ? formatPreview(result) : '⚠ transform error',
        hasTransform: true,
      };
    }
    return { raw: formatPreview(rawPreviewValue), transformed: null, hasTransform: false };
  }, [rawPreviewValue, selectedTransform, snapshot]);

  const safeOnChange = useCallback((next: FieldPickerValue | null) => onChange(next), [onChange]);

  const requestFieldPreview = useCallback((dataSourceId: string, fieldPath: string) => {
    const fieldId = getRequestedFieldId(fieldPath);
    if (!fieldId || window.parent === window) return;

    window.parent.postMessage(
      {
        type: 'thingsvis:requestFieldData',
        payload: {
          dataSourceId,
          deviceId: parseDeviceDataSourceId(dataSourceId) ?? undefined,
          fieldIds: [fieldId],
        },
      },
      '*',
    );
  }, []);

  useEffect(() => {
    if (selectedGroup !== 'device') return;
    if (!selectedDeviceGroupId || loadedGroupIds.includes(selectedDeviceGroupId)) return;
    if (window.parent === window) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as
        | { type?: string; payload?: { groupId?: string; devices?: unknown[] } }
        | undefined;
      if (data?.type !== 'tv:devices-by-group') return;
      const payload = data.payload;
      if (payload?.groupId !== selectedDeviceGroupId || !Array.isArray(payload.devices)) return;

      const devices = payload.devices as Array<{ deviceId?: string; deviceName?: string }>;
      usePlatformDeviceStore.getState().setDevicesForGroup(selectedDeviceGroupId, devices as any);
      devices.forEach((device) => {
        if (!device?.deviceId) return;
        ensurePlatformDeviceDataSource({
          deviceId: device.deviceId,
          deviceName: device.deviceName,
        });
      });
    };

    window.addEventListener('message', handleMessage);
    window.parent.postMessage(
      {
        type: 'thingsvis:requestDevicesByGroup',
        payload: {
          groupId: selectedDeviceGroupId,
        },
      },
      '*',
    );

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [loadedGroupIds, selectedDeviceGroupId, selectedGroup]);

  useEffect(() => {
    if (selectedGroup !== 'device') return;
    if (!selectedDeviceSource?.deviceId || !selectedDeviceSource?.templateId) return;
    if ((selectedDeviceSource.fields?.length ?? 0) > 0) return;
    if (window.parent === window) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as
        | { type?: string; payload?: { deviceId?: string; fields?: unknown[] } }
        | undefined;
      if (data?.type !== 'tv:device-fields') return;
      const payload = data.payload;
      if (payload?.deviceId !== selectedDeviceSource.deviceId) return;
      if (!Array.isArray(payload.fields)) return;
      usePlatformDeviceStore
        .getState()
        .updateDeviceFields(selectedDeviceSource.deviceId, payload.fields as any);
    };

    window.addEventListener('message', handleMessage);
    window.parent.postMessage(
      {
        type: 'thingsvis:requestDeviceFields',
        payload: {
          deviceId: selectedDeviceSource.deviceId,
          templateId: selectedDeviceSource.templateId,
        },
      },
      '*',
    );

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [selectedGroup, selectedDeviceSource]);

  const handleTransformChange = (code: string) => {
    if (!effectiveDataSourceId || !selectedFieldPath) return;
    safeOnChange({
      dataSourceId: effectiveDataSourceId,
      fieldPath: selectedFieldPath,
      transform: code || undefined,
    });
  };

  return (
    <div className="space-y-2">
      {isEmbeddedMode ? (
        <>
          {/* Data Source selector */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">
              {t('binding.groupLabel')}
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => {
                const nextGroup = e.target.value as SourceGroup;
                setEmbeddedSourceGroup(nextGroup);

                if (nextGroup === 'device') {
                  const nextGroupId =
                    selectedDeviceGroupIdState ||
                    String(deviceGroupOptions[0]?.groupId || deviceSources[0]?.groupId || '');
                  setSelectedDeviceGroupIdState(nextGroupId);
                  const nextDevice = deviceSources.find((device) => device.groupId === nextGroupId);
                  safeOnChange(
                    nextDevice ? { dataSourceId: nextDevice.dataSourceId, fieldPath: '' } : null,
                  );
                  return;
                }

                if (nextGroup === 'platform') {
                  const nextSource = platformSources[0];
                  if (nextSource) ensurePlatformStatDataSource(nextSource);
                  safeOnChange(nextSource ? { dataSourceId: nextSource.id, fieldPath: '' } : null);
                  return;
                }

                const nextId = customDataSourceIds[0] ?? '';
                safeOnChange(nextId ? { dataSourceId: nextId, fieldPath: '' } : null);
              }}
              className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
            >
              {hasDeviceCatalog && (
                <option value="device">
                  {hasTemplateFieldCatalog
                    ? t('binding.currentDeviceFields', '当前设备字段')
                    : t('binding.currentDeviceFields', '当前设备字段')}
                </option>
              )}
              {hasPlatformStatsCatalog && (
                <option value="platform">{t('binding.dashboardSources', '首页看板')}</option>
              )}
              {customDataSourceIds.length > 0 && (
                <option value="custom">{t('binding.customDataSources', '自定义数据源')}</option>
              )}
            </select>
          </div>

          {!isTemplateDeviceSelection && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                {selectedGroup === 'device'
                  ? t('binding.deviceGroup', '设备分组')
                  : selectedGroup === 'platform'
                    ? t('binding.businessDataSource', '业务数据源')
                    : t('binding.dataSource', '数据源')}
              </label>
              <select
                value={selectedGroup === 'device' ? selectedDeviceGroupId : effectiveDataSourceId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  if (selectedGroup === 'device') {
                    setSelectedDeviceGroupIdState(nextId);
                    const nextDevice = deviceSources.find((device) => device.groupId === nextId);
                    safeOnChange(
                      nextDevice ? { dataSourceId: nextDevice.dataSourceId, fieldPath: '' } : null,
                    );
                    return;
                  }
                  if (selectedGroup === 'platform') {
                    const nextSource = platformSources.find((source) => source.id === nextId);
                    if (nextSource) ensurePlatformStatDataSource(nextSource);
                    safeOnChange(
                      nextSource ? { dataSourceId: nextSource.id, fieldPath: '' } : null,
                    );
                    return;
                  }
                  safeOnChange(nextId ? { dataSourceId: nextId, fieldPath: '' } : null);
                }}
                className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
                disabled={
                  (selectedGroup === 'device' &&
                    deviceGroupOptions.length === 0 &&
                    deviceSources.length === 0) ||
                  (selectedGroup === 'platform' && platformSources.length === 0) ||
                  (selectedGroup === 'custom' && customDataSourceIds.length === 0)
                }
              >
                {selectedGroup === 'device' &&
                  deviceGroupOptions.map((group) => (
                    <option key={group.groupId} value={group.groupId}>
                      {group.groupName}
                    </option>
                  ))}
                {selectedGroup === 'platform' && (
                  <>
                    {platformSourcesByGroup.dashboard.length > 0 && (
                      <optgroup label={t('binding.dashboardSources', '首页看板')}>
                        {platformSourcesByGroup.dashboard.map((source) => (
                          <option key={source.id} value={source.id}>
                            {source.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {platformSourcesByGroup.currentDevice.length > 0 && (
                      <optgroup label={t('binding.currentDeviceFields', '当前设备字段')}>
                        {platformSourcesByGroup.currentDevice.map((source) => (
                          <option key={source.id} value={source.id}>
                            {source.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {platformSourcesByGroup.currentDeviceHistory.length > 0 && (
                      <optgroup label={t('binding.currentDeviceHistorySources', '当前设备历史')}>
                        {platformSourcesByGroup.currentDeviceHistory.map((source) => (
                          <option key={source.id} value={source.id}>
                            {source.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </>
                )}
                {selectedGroup === 'custom' &&
                  customDataSourceIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            {t('binding.dataSource', '数据源')}
          </label>
          <select
            value={effectiveDataSourceId}
            onChange={(e) => {
              const nextId = e.target.value;
              safeOnChange(nextId ? { dataSourceId: nextId, fieldPath: '' } : null);
            }}
            className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
            disabled={customDataSourceIds.length === 0}
          >
            <option value="">{t('binding.selectDataSource', '请选择数据源')}</option>
            {customDataSourceIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      )}

      {isEmbeddedMode && selectedGroup === 'device' && !isTemplateDeviceSelection && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            {t('binding.device', '设备')}
          </label>
          <select
            value={effectiveDataSourceId}
            onChange={(e) => {
              const nextId = e.target.value;
              safeOnChange(nextId ? { dataSourceId: nextId, fieldPath: '' } : null);
            }}
            className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
            disabled={visibleDeviceSources.length === 0}
          >
            {visibleDeviceSources.length === 0 ? (
              <option value="">
                {isSelectedDeviceGroupLoaded
                  ? t('binding.noDevicesInGroup', '该分组下暂无设备')
                  : t('binding.loadingData', '正在加载设备数据...')}
              </option>
            ) : (
              visibleDeviceSources.map((device) => (
                <option key={device.dataSourceId} value={device.dataSourceId}>
                  {device.label}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {/* Field selector */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-foreground">
            {t('binding.field', 'Field')}
          </label>
          {isOffline && (
            <span className="text-xs text-amber-500">
              {t('binding.offlineCached', '⚡ cached (offline)')}
            </span>
          )}
        </div>
        <select
          value={selectedFieldPath}
          onChange={(e) => {
            const nextPath = e.target.value;
            if (effectiveDataSourceId && nextPath) {
              requestFieldPreview(effectiveDataSourceId, nextPath);
            }
            safeOnChange(
              effectiveDataSourceId
                ? {
                    dataSourceId: effectiveDataSourceId,
                    fieldPath: nextPath,
                    transform: selectedTransform || undefined,
                  }
                : null,
            );
          }}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
          disabled={
            !effectiveDataSourceId ||
            (dsStatus === 'loading' && !fieldSchema && !hasStaticFieldOptions)
          }
        >
          <option value="">{t('binding.selectField', '(select a field)')}</option>
          {pathInfos.map((info) => {
            const p = info.path;
            const depth = p === '(root)' ? 0 : p.split('.').length;
            const indent =
              depth > 0 ? '\u00A0\u00A0\u00A0\u00A0'.repeat(depth - 1) + '↳\u00A0' : '';
            const typeTag = info.type !== 'unknown' ? ` [${info.type}]` : '';
            return (
              <option
                key={p}
                value={p}
                style={isOffline ? { color: 'var(--muted-foreground)' } : undefined}
              >
                {isOffline ? '⚡ ' : ''}
                {indent}
                {fieldDisplayNameByPath.has(p) ? `${fieldDisplayNameByPath.get(p)} (${p})` : p}
                {typeTag}
              </option>
            );
          })}
        </select>

        {dsStatus === 'loading' && !fieldSchema && !hasStaticFieldOptions && (
          <p className="text-xs text-muted-foreground">
            {t('common.loadingData', 'Loading data...')}
          </p>
        )}
        {dsStatus === 'error' && dsState?.error && (
          <p className="text-xs text-destructive">
            {t('binding.dataSourceError', 'Data source error: ')}
            {dsState.error}
          </p>
        )}
        {dsStatus === 'connected' && paths.length === 0 && snapshot === null && (
          <p className="text-xs text-muted-foreground">
            {t('binding.noDataHint', 'No data available. Check config or wait for data.')}
          </p>
        )}
        {truncated && (
          <p className="text-xs text-muted-foreground">
            {t('binding.fieldTruncated', 'Field list truncated (depth/size limit).')}
          </p>
        )}
      </div>

      {/* current value preview */}
      {previewDisplay && (
        <div className="rounded-sm border border-input bg-muted/30 px-2 py-1 text-xs font-mono">
          {previewDisplay.hasTransform ? (
            <>
              <span className="text-muted-foreground">{t('binding.fieldValueRaw', 'Raw:')} </span>
              <span className="text-foreground">{previewDisplay.raw}</span>
              <br />
              <span className="text-muted-foreground">
                {t('binding.fieldValueTransformed', 'Result:')}{' '}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {previewDisplay.transformed}
              </span>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">
                {t('binding.fieldValueCurrent', 'Current:')}{' '}
              </span>
              <span className="text-foreground">{previewDisplay.raw}</span>
            </>
          )}
        </div>
      )}

      {/* Data Transform — trigger button + Dialog editor */}
      {effectiveDataSourceId && selectedFieldPath && (
        <>
          <button
            type="button"
            onClick={() => {
              setDraftCode(selectedTransform);
              setTransformDialogOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <PenLine className="size-3" />
            <span>{t('binding.transform', 'Data Transform')}</span>
            {selectedTransform.trim() && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium leading-none">
                {t('binding.transformActive', 'active')}
              </span>
            )}
          </button>

          <Dialog open={transformDialogOpen} onOpenChange={setTransformDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {t('binding.transformDialogTitle', 'Data Transform Script')}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'binding.transformDialogSubtitle',
                    'JS expression — `value` is the field value, `data` is the full data source snapshot.',
                  )}
                </p>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-3">
                {/* Code editor */}
                <textarea
                  value={draftCode}
                  onChange={(e) => setDraftCode(e.target.value)}
                  rows={7}
                  autoFocus
                  className="w-full p-3 text-xs font-mono rounded-md border border-input bg-muted/20 focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset focus:outline-none resize-y"
                  placeholder={t(
                    'binding.transformPlaceholder',
                    '// e.g.\nvalue * 100\n// data.items.find(x => x.id === value)?.label',
                  )}
                  spellCheck={false}
                />

                {/* Available variables docs */}
                <div className="rounded-md bg-muted/40 px-3 py-2 text-xs space-y-0.5">
                  <p className="font-mono text-foreground/80">
                    {t('binding.transformDocsValue', '`value` — the selected field value')}
                  </p>
                  <p className="font-mono text-foreground/80">
                    {t('binding.transformDocsData', '`data` — full data source snapshot')}
                  </p>
                </div>

                {/* Live preview */}
                {rawPreviewValue !== undefined &&
                  draftCode.trim() &&
                  (() => {
                    const { ok, result } = applyTransform(draftCode, rawPreviewValue, snapshot);
                    return (
                      <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-xs font-mono space-y-1">
                        <div>
                          <span className="text-muted-foreground">
                            {t('binding.fieldValueRaw', 'Raw:')}{' '}
                          </span>
                          <span>{formatPreview(rawPreviewValue)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            {t('binding.fieldValueTransformed', 'Result:')}{' '}
                          </span>
                          {ok ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {formatPreview(result)}
                            </span>
                          ) : (
                            <span className="text-destructive">
                              {t('binding.transformError', '⚠ Transform expression error')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraftCode('');
                  }}
                >
                  {t('binding.transformClear', 'Clear')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setTransformDialogOpen(false)}>
                  {t('binding.transformCancel', 'Cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    handleTransformChange(draftCode);
                    setTransformDialogOpen(false);
                  }}
                >
                  {t('binding.transformSave', 'Apply')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

export default FieldPicker;
