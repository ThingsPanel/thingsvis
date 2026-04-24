import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine } from 'lucide-react';
import type { KernelStore } from '@thingsvis/kernel';
import { useDataSourceRegistry } from '@thingsvis/ui';
import { DEFAULT_PLATFORM_FIELD_CONFIG } from '@thingsvis/schema';
import { dataSourceManager } from '@/lib/store';
import { usePlatformDeviceStore } from '@/lib/stores/platformDeviceStore';
import { usePlatformFieldStore } from '@/lib/stores/platformFieldStore';
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

type SourceGroup = 'device' | 'deviceStatus' | 'deviceHistory' | 'platform' | 'custom';

const TEMPLATE_DEVICE_ID = '__template__';
const HISTORY_FIELD_SUFFIX = '__history';

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
  targetKind?: string;
  writableOnly?: boolean;
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

function isHistoryFieldPath(fieldPath: string): boolean {
  return fieldPath.endsWith(HISTORY_FIELD_SUFFIX);
}

function isTemplateDeviceSource(device: { deviceId?: string } | undefined): boolean {
  return device?.deviceId === TEMPLATE_DEVICE_ID;
}

function isTelemetryField(field: unknown): boolean {
  if (!field || typeof field !== 'object') return false;
  const dataType = (field as { dataType?: unknown }).dataType;
  return dataType === undefined || dataType === 'telemetry';
}

function isFieldTypeCompatible(type: FieldPathInfo['type'], targetKind?: string): boolean {
  if (!targetKind || type === 'unknown') return true;

  if (targetKind === 'boolean') return type === 'boolean';
  if (targetKind === 'number' || targetKind === 'slider' || targetKind === 'rangeSlider') {
    return type === 'number';
  }
  if (targetKind === 'string' || targetKind === 'textarea' || targetKind === 'select') {
    return type === 'string' || type === 'number' || type === 'boolean';
  }
  if (targetKind === 'color') return type === 'string';

  return true;
}

function getStaticFieldId(field: unknown): string {
  if (!field || typeof field !== 'object') return '';
  const id = (field as { id?: unknown }).id;
  return typeof id === 'string' ? id : '';
}

function getStaticFieldType(field: unknown): FieldPathInfo['type'] {
  if (!field || typeof field !== 'object') return 'unknown';
  const type = (field as { type?: unknown }).type;
  return type === 'string' ||
    type === 'number' ||
    type === 'boolean' ||
    type === 'object' ||
    type === 'array' ||
    type === 'unknown'
    ? type
    : 'string';
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

export function FieldPicker({
  kernelStore,
  value,
  onChange,
  targetKind,
  writableOnly = false,
  maxDepth,
  maxNodes,
}: Props) {
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
      (providerCatalog?.dataSources ?? [])
        // When context=dashboard, only dashboard group makes sense (no device scoped).
        // When context=device-template, expose all groups (device history etc. are relevant).
        // When context is unset, include everything so nothing is silently hidden.
        .filter((source) => serviceConfig.context !== 'dashboard' || source.group === 'dashboard')
        .map((source) => ({
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
    [locale, providerCatalog, serviceConfig.context, t],
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
  const runtimeDeviceFieldIds = useMemo(
    () => new Set(runtimeDeviceFields.map((field) => field.id)),
    [runtimeDeviceFields],
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
  const visiblePlatformSources = useMemo(
    () => (writableOnly ? [] : platformSources.filter((source) => source.group === 'dashboard')),
    [platformSources, writableOnly],
  );

  const platformDeviceGroups = usePlatformDeviceStore((s) => s.groups ?? []);
  const loadedPlatformGroupIds = usePlatformDeviceStore((s) => s.loadedGroupIds ?? []);
  const platformDevices = usePlatformDeviceStore((s) => s.devices ?? []);
  const platformFields = usePlatformFieldStore((s) => s.fields ?? []);

  const [transformDialogOpen, setTransformDialogOpen] = useState(false);
  /** Draft code while the dialog is open — only committed on Apply */
  const [draftCode, setDraftCode] = useState('');
  const [deviceSearchText, setDeviceSearchText] = useState('');
  const [deviceGroupsRequested, setDeviceGroupsRequested] = useState(false);
  const [selectedPlatformGroupId, setSelectedPlatformGroupId] = useState('');

  const selectedDataSourceId = value?.dataSourceId || '';
  const selectedFieldPath = value?.fieldPath || '';
  const selectedTransform = value?.transform || '';
  const safeOnChange = useCallback((next: FieldPickerValue | null) => onChange(next), [onChange]);
  const [embeddedSourceGroup, setEmbeddedSourceGroup] = useState<SourceGroup>('device');

  const deviceSources = useMemo(() => {
    const fromStore = platformDevices.map((device) => ({
      deviceId: device.deviceId,
      label: device.deviceName || `Device ${device.deviceId}`,
      groupId: device.groupId || device.groupName || '__ungrouped__',
      groupName: device.groupName || t('binding.deviceFields', 'Device Fields'),
      deviceConfigId: device.deviceConfigId,
      templateId: device.templateId,
      dataSourceId: getDeviceDataSourceId(device.deviceId),
      fields: device.fields ?? [],
    }));

    const templateDevice =
      serviceConfig.context === 'device-template' &&
      platformFields.length > 0 &&
      !fromStore.some((device) => isTemplateDeviceSource(device))
        ? [
            {
              deviceId: TEMPLATE_DEVICE_ID,
              label: t('binding.templateFields', '物模型字段'),
              groupId: TEMPLATE_DEVICE_ID,
              groupName: t('binding.templateFields', '物模型字段'),
              deviceConfigId: undefined,
              templateId: undefined,
              dataSourceId: getDeviceDataSourceId(TEMPLATE_DEVICE_ID),
              fields: platformFields,
            },
          ]
        : [];

    const knownDeviceIds = new Set(
      [...fromStore, ...templateDevice].map((item) => item.dataSourceId),
    );
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
          deviceConfigId: undefined,
          templateId: undefined,
          dataSourceId: id,
          fields: [],
        };
      });

    return [...templateDevice, ...fromStore, ...inferred].sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [dataSourceIds, platformDevices, platformFields, serviceConfig.context, t]);

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
  const hasPlatformStatsCatalog = isEmbeddedMode && visiblePlatformSources.length > 0;
  // Device-scoped field groups are not relevant in the dashboard context;
  // they are only shown in the device-template context.
  const isDashboardContext = serviceConfig.context === 'dashboard';
  const hasLazyDeviceCatalog = isEmbeddedMode && !isDashboardContext;
  const hasDeviceCatalog =
    !isDashboardContext &&
    (deviceSources.length > 0 || platformDeviceGroups.length > 0 || hasLazyDeviceCatalog);
  const hasTemplateFieldCatalog =
    isEmbeddedMode &&
    (serviceConfig.context === 'device-template' ||
      (deviceSources.length === 1 && isTemplateDeviceSource(deviceSources[0])));
  const deviceSourceLabel = hasTemplateFieldCatalog
    ? t('binding.templateFields', '物模型字段')
    : t('binding.deviceData', '当前设备字段');
  const hasDeviceStatusCatalog =
    isEmbeddedMode && !isDashboardContext && !writableOnly && runtimeDeviceFields.length > 0;
  const hasDeviceHistoryCatalog =
    isEmbeddedMode && !isDashboardContext && !writableOnly && hasDeviceCatalog;

  useEffect(() => {
    if (!isEmbeddedMode) return;

    if (selectedDataSourceId && parseDeviceDataSourceId(selectedDataSourceId)) {
      const fieldRoot = getRequestedFieldId(selectedFieldPath) ?? '';
      if (isHistoryFieldPath(fieldRoot)) {
        setEmbeddedSourceGroup('deviceHistory');
      } else if (runtimeDeviceFieldIds.has(fieldRoot)) {
        setEmbeddedSourceGroup('deviceStatus');
      } else {
        setEmbeddedSourceGroup('device');
      }
      const selectedDevice = deviceSources.find(
        (device) => device.dataSourceId === selectedDataSourceId,
      );
      if (selectedDevice?.label) setDeviceSearchText('');
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
    runtimeDeviceFieldIds,
    selectedDataSourceId,
    selectedFieldPath,
  ]);

  const selectedGroup = isEmbeddedMode ? embeddedSourceGroup : 'custom';
  const isDeviceScopedGroup =
    selectedGroup === 'device' ||
    selectedGroup === 'deviceStatus' ||
    selectedGroup === 'deviceHistory';
  const hasHostDeviceCatalog =
    isEmbeddedMode && isDeviceScopedGroup && !hasTemplateFieldCatalog && window.parent !== window;

  useEffect(() => {
    if (!hasHostDeviceCatalog) return;
    if (platformDeviceGroups.length > 0 || deviceGroupsRequested) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; payload?: { groups?: unknown[] } } | undefined;
      if (data?.type !== 'tv:device-groups') return;
      const groups = Array.isArray(data.payload?.groups) ? data.payload.groups : [];
      usePlatformDeviceStore.getState().setGroups(groups as any);
    };

    setDeviceGroupsRequested(true);
    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: 'thingsvis:requestDeviceGroups', payload: {} }, '*');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [deviceGroupsRequested, hasHostDeviceCatalog, platformDeviceGroups.length]);

  useEffect(() => {
    if (!isDeviceScopedGroup || platformDeviceGroups.length === 0) return;
    if (
      !selectedPlatformGroupId ||
      !platformDeviceGroups.some((group) => group.groupId === selectedPlatformGroupId)
    ) {
      setSelectedPlatformGroupId(platformDeviceGroups[0]?.groupId || '');
    }
  }, [isDeviceScopedGroup, platformDeviceGroups, selectedPlatformGroupId]);

  const visibleDeviceSources = useMemo(() => {
    if (!isDeviceScopedGroup) return [];
    const keyword = deviceSearchText.trim().toLowerCase();
    const scopedDevices =
      selectedPlatformGroupId && platformDeviceGroups.length > 0
        ? deviceSources.filter((device) => device.groupId === selectedPlatformGroupId)
        : deviceSources;
    if (!keyword) return scopedDevices;
    return scopedDevices.filter((device) =>
      [device.label, device.deviceId, device.templateId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [
    deviceSearchText,
    deviceSources,
    isDeviceScopedGroup,
    platformDeviceGroups.length,
    selectedPlatformGroupId,
  ]);

  const selectedDeviceSource = isDeviceScopedGroup
    ? deviceSources.find((device) => device.dataSourceId === selectedDataSourceId) ||
      visibleDeviceSources[0] ||
      deviceSources[0]
    : undefined;
  const isTemplateDeviceSelection =
    hasTemplateFieldCatalog && isDeviceScopedGroup && isTemplateDeviceSource(selectedDeviceSource);
  const pendingPlatformGroupIds = useMemo(() => {
    if (!isEmbeddedMode || !isDeviceScopedGroup || isTemplateDeviceSelection) return [];
    if (window.parent === window) return [];
    if (!selectedPlatformGroupId) return [];
    const loadedGroupIds = new Set(loadedPlatformGroupIds);
    return loadedGroupIds.has(selectedPlatformGroupId) ? [] : [selectedPlatformGroupId];
  }, [
    isDeviceScopedGroup,
    isEmbeddedMode,
    isTemplateDeviceSelection,
    loadedPlatformGroupIds,
    selectedPlatformGroupId,
  ]);
  const isPlatformDeviceListLoading =
    isEmbeddedMode &&
    isDeviceScopedGroup &&
    !isTemplateDeviceSelection &&
    pendingPlatformGroupIds.length > 0;

  useEffect(() => {
    if (!isPlatformDeviceListLoading) return;

    const pendingGroupIds = new Set(pendingPlatformGroupIds);
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as
        | { type?: string; payload?: { groupId?: string; devices?: unknown[] } }
        | undefined;
      if (data?.type !== 'tv:devices-by-group') return;

      const payload = data.payload;
      if (!payload?.groupId || !pendingGroupIds.has(payload.groupId)) return;
      if (!Array.isArray(payload.devices)) return;

      usePlatformDeviceStore.getState().setDevicesForGroup(payload.groupId, payload.devices as any);
    };

    window.addEventListener('message', handleMessage);
    const [groupId] = pendingPlatformGroupIds;
    if (groupId) {
      window.parent.postMessage(
        {
          type: 'thingsvis:requestDevicesByGroup',
          payload: { groupId },
        },
        '*',
      );
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isPlatformDeviceListLoading, pendingPlatformGroupIds]);

  const selectedDeviceBaseFields = useMemo(() => {
    if (!isDeviceScopedGroup) return [];
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
  }, [isDeviceScopedGroup, runtimeDeviceFields, selectedDeviceSource]);

  const selectedDeviceFields = useMemo(() => {
    if (selectedGroup !== 'device') return [];
    return selectedDeviceBaseFields.filter((field: any) => {
      const fieldId = getStaticFieldId(field);
      if (runtimeDeviceFieldIds.has(fieldId)) return false;
      return isFieldTypeCompatible(getStaticFieldType(field), targetKind);
    });
  }, [runtimeDeviceFieldIds, selectedDeviceBaseFields, selectedGroup, targetKind]);

  const selectedDeviceStatusFields = useMemo(() => {
    if (selectedGroup !== 'deviceStatus') return [];
    return selectedDeviceBaseFields.filter((field: any) => {
      const fieldId = getStaticFieldId(field);
      if (!runtimeDeviceFieldIds.has(fieldId)) return false;
      return isFieldTypeCompatible(getStaticFieldType(field), targetKind);
    });
  }, [runtimeDeviceFieldIds, selectedDeviceBaseFields, selectedGroup, targetKind]);

  const selectedDeviceHistoryFields = useMemo(() => {
    if (selectedGroup !== 'deviceHistory') return [];
    return selectedDeviceBaseFields
      .filter((field: any) => {
        const fieldId = getStaticFieldId(field);
        if (!fieldId || runtimeDeviceFieldIds.has(fieldId)) return false;
        if (!isTelemetryField(field)) return false;
        return getStaticFieldType(field) === 'number';
      })
      .map((field: any) => {
        const fieldId = getStaticFieldId(field);
        const rawLabel =
          typeof field?.alias === 'string' && field.alias
            ? field.alias
            : typeof field?.name === 'string' && field.name
              ? field.name
              : fieldId;
        return {
          id: `${fieldId}${HISTORY_FIELD_SUFFIX}`,
          name: `${rawLabel} ${t('binding.historySeriesSuffix', '历史趋势')}`,
          type: 'array' as FieldPathInfo['type'],
        };
      });
  }, [runtimeDeviceFieldIds, selectedDeviceBaseFields, selectedGroup, t]);

  const selectedPlatformSource =
    selectedGroup === 'platform'
      ? visiblePlatformSources.find((source) => source.id === selectedDataSourceId) ||
        visiblePlatformSources[0]
      : undefined;

  const selectedPlatformFields = useMemo(() => {
    if (selectedGroup !== 'platform') return [];
    return (selectedPlatformSource?.fields ?? []).filter((field) =>
      isFieldTypeCompatible(field.type, targetKind),
    );
  }, [selectedPlatformSource, selectedGroup, targetKind]);
  const hasStaticFieldOptions =
    (selectedGroup === 'device' && selectedDeviceFields.length > 0) ||
    (selectedGroup === 'deviceStatus' && selectedDeviceStatusFields.length > 0) ||
    (selectedGroup === 'deviceHistory' && selectedDeviceHistoryFields.length > 0) ||
    (selectedGroup === 'platform' && selectedPlatformFields.length > 0);
  const fieldDisplayNameByPath = useMemo(() => {
    const labels = new Map<string, string>();
    if (selectedGroup === 'device' || selectedGroup === 'deviceStatus') {
      const fields = selectedGroup === 'device' ? selectedDeviceFields : selectedDeviceStatusFields;
      fields.forEach((field: any) => {
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
    if (selectedGroup === 'deviceHistory') {
      selectedDeviceHistoryFields.forEach((field) => {
        if (field.name && field.name !== field.id) labels.set(field.id, field.name);
      });
    }
    if (selectedGroup === 'platform') {
      selectedPlatformFields.forEach((field) => {
        if (field.name && field.name !== field.id) labels.set(field.id, field.name);
      });
    }
    return labels;
  }, [
    selectedDeviceFields,
    selectedDeviceHistoryFields,
    selectedDeviceStatusFields,
    selectedGroup,
    selectedPlatformFields,
  ]);

  const effectiveDataSourceId = !isEmbeddedMode
    ? customDataSourceIds.includes(selectedDataSourceId)
      ? selectedDataSourceId
      : (customDataSourceIds[0] ?? '')
    : isDeviceScopedGroup
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
    const finalize = (infos: FieldPathInfo[], isTruncated = false) => {
      const filtered = infos.filter((info) => isFieldTypeCompatible(info.type, targetKind));
      return {
        paths: filtered.map((info) => info.path),
        pathInfos: filtered,
        truncated: isTruncated,
      };
    };

    if (selectedGroup === 'custom' && Array.isArray(fieldSchema) && fieldSchema.length > 0) {
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
      return finalize(infos);
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
      return finalize(staticInfos);
    }
    if (selectedGroup === 'deviceStatus' && selectedDeviceStatusFields.length > 0) {
      const staticInfos: FieldPathInfo[] = selectedDeviceStatusFields.map((field: any) => ({
        path: field.id,
        type: (field.type ?? 'string') as FieldPathInfo['type'],
      }));
      return finalize(staticInfos);
    }
    if (selectedGroup === 'deviceHistory' && selectedDeviceHistoryFields.length > 0) {
      const staticInfos: FieldPathInfo[] = selectedDeviceHistoryFields.map((field) => ({
        path: field.id,
        type: field.type,
      }));
      return finalize(staticInfos);
    }
    if (selectedGroup === 'platform' && selectedPlatformFields.length > 0) {
      const staticInfos: FieldPathInfo[] = selectedPlatformFields.map((field) => ({
        path: field.id,
        type: field.type as FieldPathInfo['type'],
      }));
      return finalize(staticInfos);
    }
    const live = listFieldPaths(snapshot, {
      maxDepth: maxDepth ?? 5,
      maxNodes: maxNodes ?? 200,
    });
    return finalize(live.pathInfos, live.truncated);
  }, [
    fieldSchema,
    snapshot,
    maxDepth,
    maxNodes,
    selectedGroup,
    selectedDeviceFields,
    selectedDeviceHistoryFields,
    selectedDeviceStatusFields,
    selectedPlatformFields,
    targetKind,
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
    if (!isDeviceScopedGroup) return;
    if (!selectedDeviceSource?.deviceId) return;
    if (!selectedDeviceSource?.templateId && !selectedDeviceSource?.deviceConfigId) return;
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
          deviceConfigId: selectedDeviceSource.deviceConfigId,
        },
      },
      '*',
    );

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isDeviceScopedGroup, selectedDeviceSource]);

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

                if (
                  nextGroup === 'device' ||
                  nextGroup === 'deviceStatus' ||
                  nextGroup === 'deviceHistory'
                ) {
                  const nextDevice = deviceSources[0];
                  safeOnChange(
                    nextDevice ? { dataSourceId: nextDevice.dataSourceId, fieldPath: '' } : null,
                  );
                  return;
                }

                if (nextGroup === 'platform') {
                  const nextSource = visiblePlatformSources[0];
                  if (nextSource) ensurePlatformStatDataSource(nextSource);
                  safeOnChange(nextSource ? { dataSourceId: nextSource.id, fieldPath: '' } : null);
                  return;
                }

                const nextId = customDataSourceIds[0] ?? '';
                safeOnChange(nextId ? { dataSourceId: nextId, fieldPath: '' } : null);
              }}
              className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
            >
              {hasDeviceCatalog && <option value="device">{deviceSourceLabel}</option>}
              {hasDeviceStatusCatalog && (
                <option value="deviceStatus">
                  {t('binding.deviceStatusFields', '设备状态字段')}
                </option>
              )}
              {hasDeviceHistoryCatalog && (
                <option value="deviceHistory">
                  {t('binding.deviceHistoryTelemetry', '设备历史遥测')}
                </option>
              )}
              {hasPlatformStatsCatalog && (
                <option value="platform">{t('binding.dashboardSources', '平台概览')}</option>
              )}
              {customDataSourceIds.length > 0 && (
                <option value="custom">{t('binding.customDataSources', '自定义数据源')}</option>
              )}
            </select>
          </div>

          {selectedGroup !== 'device' &&
            selectedGroup !== 'deviceStatus' &&
            selectedGroup !== 'deviceHistory' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  {selectedGroup === 'platform'
                    ? t('binding.businessDataSource', '业务数据源')
                    : t('binding.dataSource', '数据源')}
                </label>
                <select
                  value={effectiveDataSourceId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    if (selectedGroup === 'platform') {
                      const nextSource = visiblePlatformSources.find(
                        (source) => source.id === nextId,
                      );
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
                    (selectedGroup === 'platform' && visiblePlatformSources.length === 0) ||
                    (selectedGroup === 'custom' && customDataSourceIds.length === 0)
                  }
                >
                  {selectedGroup === 'platform' && (
                    <>
                      {platformSourcesByGroup.dashboard.length > 0 && (
                        <optgroup label={t('binding.dashboardSources', '平台概览')}>
                          {platformSourcesByGroup.dashboard.map((source) => (
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

      {isEmbeddedMode && isDeviceScopedGroup && !isTemplateDeviceSelection && (
        <div className="space-y-1">
          {platformDeviceGroups.length > 0 && (
            <>
              <label className="text-sm font-medium text-muted-foreground">
                {t('binding.deviceGroup', '设备分组')}
              </label>
              <select
                value={selectedPlatformGroupId}
                onChange={(e) => {
                  const nextGroupId = e.target.value;
                  setSelectedPlatformGroupId(nextGroupId);
                  setDeviceSearchText('');
                  const nextDevice = deviceSources.find((device) => device.groupId === nextGroupId);
                  safeOnChange(
                    nextDevice ? { dataSourceId: nextDevice.dataSourceId, fieldPath: '' } : null,
                  );
                }}
                className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
              >
                {platformDeviceGroups.map((group) => (
                  <option key={group.groupId} value={group.groupId}>
                    {group.groupName}
                    {typeof group.deviceCount === 'number' ? ` (${group.deviceCount})` : ''}
                  </option>
                ))}
              </select>
            </>
          )}
          <label className="text-sm font-medium text-muted-foreground">
            {t('binding.device', '设备')}
          </label>
          <input
            value={deviceSearchText}
            onChange={(e) => setDeviceSearchText(e.target.value)}
            placeholder={t('binding.searchDevice', '搜索设备名称或ID')}
            className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset"
          />
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
                {isPlatformDeviceListLoading || deviceSources.length === 0
                  ? t('binding.loadingData', '正在加载设备数据...')
                  : t('binding.noMatchedDevices', '未找到匹配设备')}
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
            if (isDeviceScopedGroup && selectedDeviceSource?.deviceId && nextPath) {
              ensurePlatformDeviceDataSource({
                deviceId: selectedDeviceSource.deviceId,
                deviceName: selectedDeviceSource.label,
              });
            }
            if (selectedGroup === 'platform' && selectedPlatformSource && nextPath) {
              ensurePlatformStatDataSource(selectedPlatformSource);
            }
            if (isDeviceScopedGroup && effectiveDataSourceId && nextPath) {
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
