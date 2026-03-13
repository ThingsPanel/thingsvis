import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine } from 'lucide-react';
import type { KernelStore } from '@thingsvis/kernel';
import { useDataSourceRegistry } from '@thingsvis/ui';
import { usePlatformFieldStore } from '@/lib/stores/platformFieldStore';
import { usePlatformDeviceStore } from '@/lib/stores/platformDeviceStore';
import { resolveEditorServiceConfig } from '@/lib/embedded/service-config';
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

type SourceGroup = 'platform' | 'device' | 'custom';

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

export function FieldPicker({ kernelStore, value, onChange, maxDepth, maxNodes }: Props) {
  const { t } = useTranslation('editor');
  const { states } = useDataSourceRegistry(kernelStore);
  const dataSourceIds = useMemo(() => Object.keys(states).sort(), [states]);

  // 🆕 平台字段（嵌入模式）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const platformFields = usePlatformFieldStore((s: any) => s.fields ?? []);
  const platformDevices = usePlatformDeviceStore((s) => s.devices ?? []);
  const hasPlatformFields = platformFields.length > 0;

  const [transformDialogOpen, setTransformDialogOpen] = useState(false);
  /** Draft code while the dialog is open — only committed on Apply */
  const [draftCode, setDraftCode] = useState('');

  const selectedDataSourceId = value?.dataSourceId || '';
  const selectedFieldPath = value?.fieldPath || '';
  const selectedTransform = value?.transform || '';

  const deviceSources = useMemo(() => {
    const fromStore = platformDevices.map((device) => ({
      deviceId: device.deviceId,
      label: device.deviceName || `Device ${device.deviceId}`,
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
      dataSourceIds.filter((id) => id !== '__platform__' && parseDeviceDataSourceId(id) === null),
    [dataSourceIds],
  );
  const isEmbeddedMode = useMemo(() => resolveEditorServiceConfig().mode === 'embedded', []);

  const selectedGroup = useMemo<SourceGroup>(() => {
    if (!isEmbeddedMode) return 'custom';
    if (selectedDataSourceId === '__platform__') return 'platform';
    if (selectedDataSourceId && parseDeviceDataSourceId(selectedDataSourceId)) return 'device';
    if (selectedDataSourceId) return 'custom';
    if (hasPlatformFields) return 'platform';
    if (deviceSources.length > 0) return 'device';
    return 'custom';
  }, [selectedDataSourceId, hasPlatformFields, deviceSources.length, isEmbeddedMode]);

  const deviceGroupNames = useMemo(
    () => Array.from(new Set(deviceSources.map((device) => device.groupName))).sort(),
    [deviceSources],
  );

  const selectedDeviceSource =
    selectedGroup === 'device'
      ? deviceSources.find((device) => device.dataSourceId === selectedDataSourceId) ||
        deviceSources[0]
      : undefined;

  const selectedDeviceGroup =
    selectedGroup === 'device' ? selectedDeviceSource?.groupName || deviceGroupNames[0] || '' : '';

  const visibleDeviceSources = useMemo(
    () =>
      selectedGroup === 'device'
        ? deviceSources.filter((device) => device.groupName === selectedDeviceGroup)
        : [],
    [deviceSources, selectedGroup, selectedDeviceGroup],
  );

  const selectedDeviceFields = useMemo(() => {
    if (selectedGroup !== 'device') return [];

    const directFields = selectedDeviceSource?.fields ?? [];
    if (directFields.length > 0) return directFields;

    const siblingFields = visibleDeviceSources.find(
      (device) => (device.fields?.length ?? 0) > 0,
    )?.fields;
    if ((siblingFields?.length ?? 0) > 0) return siblingFields ?? [];

    return platformFields;
  }, [platformFields, selectedDeviceSource, selectedGroup, visibleDeviceSources]);

  const effectiveDataSourceId = !isEmbeddedMode
    ? customDataSourceIds.includes(selectedDataSourceId)
      ? selectedDataSourceId
      : (customDataSourceIds[0] ?? '')
    : selectedGroup === 'platform'
      ? hasPlatformFields
        ? '__platform__'
        : ''
      : selectedGroup === 'device'
        ? (selectedDeviceSource?.dataSourceId ?? '')
        : selectedDataSourceId || customDataSourceIds[0] || '';
  const isPlatformSource = effectiveDataSourceId === '__platform__';

  const dsState = effectiveDataSourceId && !isPlatformSource ? states[effectiveDataSourceId] : null;
  const snapshot = dsState?.data ?? null;
  const dsStatus = dsState?.status ?? 'disconnected';
  // fieldSchema — available even when DS is offline (cached from last connection)
  const fieldSchema = (dsState as any)?.fieldSchema ?? null;
  const isOffline = snapshot === null && fieldSchema !== null;
  // Live data snapshot emitted by PlatformFieldAdapter (populated whenever the host pushes tv:platform-data).
  // Used to traverse JSON sub-paths and expose __history buffer keys in the field picker.
  const platformSnapshot = isPlatformSource
    ? ((states['__platform__'] as any)?.data ?? null)
    : null;

  // Derive field paths for the active data source.
  // Platform source: prefer live adapter snapshot to expose JSON sub-paths + __history keys;
  //   fall back to static field definitions with optional jsonSchema sub-path hints.
  // Non-platform: prefer cached fieldSchema (offline-friendly); fall back to live snapshot traversal.
  const { paths, pathInfos, truncated } = useMemo(() => {
    if (isPlatformSource) {
      if (platformSnapshot && typeof platformSnapshot === 'object') {
        return listFieldPaths(platformSnapshot, {
          maxDepth: maxDepth ?? 5,
          maxNodes: maxNodes ?? 200,
        });
      }
      // Fallback: static field list + optional jsonSchema sub-path hints
      const staticInfos: FieldPathInfo[] = [];
      (
        platformFields as Array<{ id: string; type?: string; jsonSchema?: Record<string, string> }>
      ).forEach((f) => {
        staticInfos.push({ path: f.id, type: (f.type ?? 'string') as FieldPathInfo['type'] });
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
    return listFieldPaths(snapshot, {
      maxDepth: maxDepth ?? 5,
      maxNodes: maxNodes ?? 200,
    });
  }, [
    fieldSchema,
    snapshot,
    maxDepth,
    maxNodes,
    isPlatformSource,
    selectedGroup,
    selectedDeviceFields,
    platformFields,
    platformSnapshot,
  ]);

  // 🆕 当前值预览
  const rawPreviewValue = useMemo(() => {
    if (!selectedFieldPath) return undefined;
    const activeSnapshot = isPlatformSource ? platformSnapshot : snapshot;
    if (!activeSnapshot) return undefined;
    return resolveFieldPath(activeSnapshot, selectedFieldPath);
  }, [snapshot, platformSnapshot, selectedFieldPath, isPlatformSource]);

  const previewDisplay = useMemo(() => {
    if (rawPreviewValue === undefined) return null;
    if (selectedTransform.trim()) {
      // Pass full DS snapshot as `data` so the preview matches runtime behaviour
      const activeSnapshot = isPlatformSource ? platformSnapshot : snapshot;
      const { ok, result } = applyTransform(selectedTransform, rawPreviewValue, activeSnapshot);
      return {
        raw: formatPreview(rawPreviewValue),
        transformed: ok ? formatPreview(result) : '⚠ transform error',
        hasTransform: true,
      };
    }
    return { raw: formatPreview(rawPreviewValue), transformed: null, hasTransform: false };
  }, [rawPreviewValue, selectedTransform, snapshot, platformSnapshot, isPlatformSource]);

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
                const nextId =
                  nextGroup === 'platform'
                    ? '__platform__'
                    : nextGroup === 'device'
                      ? (deviceSources[0]?.dataSourceId ?? '')
                      : (customDataSourceIds[0] ?? '');
                safeOnChange(nextId ? { dataSourceId: nextId, fieldPath: '' } : null);
              }}
              className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
            >
              {hasPlatformFields && (
                <option value="platform">{t('binding.platformFieldsLabel')}</option>
              )}
              {deviceSources.length > 0 && (
                <option value="device">{t('binding.deviceFields')}</option>
              )}
              {customDataSourceIds.length > 0 && (
                <option value="custom">{t('binding.customDataSources')}</option>
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">
              {selectedGroup === 'device' ? t('binding.deviceGroup') : t('binding.dataSource')}
            </label>
            <select
              value={selectedGroup === 'device' ? selectedDeviceGroup : effectiveDataSourceId}
              onChange={(e) => {
                const nextId = e.target.value;
                if (selectedGroup === 'device') {
                  const nextDevice = deviceSources.find((device) => device.groupName === nextId);
                  safeOnChange(
                    nextDevice ? { dataSourceId: nextDevice.dataSourceId, fieldPath: '' } : null,
                  );
                  return;
                }
                safeOnChange(nextId ? { dataSourceId: nextId, fieldPath: '' } : null);
              }}
              className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
              disabled={
                (selectedGroup === 'platform' && !hasPlatformFields) ||
                (selectedGroup === 'device' && deviceSources.length === 0) ||
                (selectedGroup === 'custom' && customDataSourceIds.length === 0)
              }
            >
              {selectedGroup === 'platform' && (
                <option value="__platform__">{t('binding.platformFieldsLabel')}</option>
              )}
              {selectedGroup === 'device' &&
                deviceGroupNames.map((groupName) => (
                  <option key={groupName} value={groupName}>
                    {groupName}
                  </option>
                ))}
              {selectedGroup === 'custom' &&
                customDataSourceIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
            </select>
          </div>
        </>
      ) : (
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            {t('binding.dataSource')}
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
            <option value="">{t('binding.selectDataSource', '(select a data source)')}</option>
            {customDataSourceIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      )}

      {isEmbeddedMode && selectedGroup === 'device' && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">{t('binding.device')}</label>
          <select
            value={effectiveDataSourceId}
            onChange={(e) => {
              const nextId = e.target.value;
              safeOnChange(nextId ? { dataSourceId: nextId, fieldPath: '' } : null);
            }}
            className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset "
            disabled={visibleDeviceSources.length === 0}
          >
            {visibleDeviceSources.map((device) => (
              <option key={device.dataSourceId} value={device.dataSourceId}>
                {device.label}
              </option>
            ))}
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
            !effectiveDataSourceId || (dsStatus === 'loading' && !isPlatformSource && !fieldSchema)
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
                {p}
                {typeTag}
              </option>
            );
          })}
        </select>

        {dsStatus === 'loading' && !isPlatformSource && !fieldSchema && (
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
        {dsStatus === 'connected' &&
          paths.length === 0 &&
          snapshot === null &&
          !isPlatformSource && (
            <p className="text-xs text-muted-foreground">
              {t('binding.noDataHint', 'No data available. Check config or wait for data.')}
            </p>
          )}
        {truncated && (
          <p className="text-xs text-muted-foreground">
            {t('binding.fieldTruncated', 'Field list truncated (depth/size limit).')}
          </p>
        )}
        {isPlatformSource && platformFields.length > 0 && selectedFieldPath && (
          <p className="text-xs text-muted-foreground">
            💡 {t('binding.externalProvided', 'Platform field provided by host app')}
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
