import { useMemo } from 'react';
import type { KernelStore } from '@thingsvis/kernel';
import { useDataSourceRegistry } from '@thingsvis/ui';
import { resolveEditorServiceConfig } from '@/lib/embedded/service-config';

import { listFieldPaths } from './fieldPath';

export type FieldPickerValue = {
  dataSourceId: string;
  fieldPath: string;
};

type Props = {
  kernelStore: KernelStore;
  value: FieldPickerValue | null;
  onChange: (next: FieldPickerValue | null) => void;
  maxDepth?: number;
  maxNodes?: number;
  language?: string;
};

import { isEmbedMode } from '@/embed/embed-mode';

export function FieldPicker({ kernelStore, value, onChange, maxDepth, maxNodes, language }: Props) {
  const { states } = useDataSourceRegistry(kernelStore);
  const dataSourceIds = useMemo(() => Object.keys(states).sort(), [states]);

  // Get platform fields from service config
  const serviceConfig = resolveEditorServiceConfig();
  const platformFields = serviceConfig.platformFields || [];

  const t = (zh: string, en: string) => (language === 'zh' ? zh : en);

  // Use controlled value, or default to first data source if none selected
  const selectedDataSourceId = value?.dataSourceId || '';
  const selectedFieldPath = value?.fieldPath || '';

  // Check if selected source is platform fields
  const isEmbedded = isEmbedMode();

  // In embedded mode, if no source is selected, default to platform source
  const effectiveDataSourceId = (isEmbedded && !selectedDataSourceId) ? '__platform__' : selectedDataSourceId;

  const isPlatformSource = effectiveDataSourceId === '__platform__';

  const dsState = effectiveDataSourceId && !isPlatformSource ? states[effectiveDataSourceId] : null;
  const snapshot = dsState?.data ?? null;
  const dsStatus = dsState?.status ?? 'disconnected';

  // For platform fields, create a virtual data structure
  const platformFieldPaths = useMemo(() => {
    if (!isPlatformSource) return [];
    return platformFields.map(f => f.id);
  }, [isPlatformSource, platformFields]);

  const { paths, truncated } = useMemo(() => {
    if (isPlatformSource) {
      return { paths: platformFieldPaths, truncated: false };
    }
    return listFieldPaths(snapshot, {
      maxDepth: maxDepth ?? 5,
      maxNodes: maxNodes ?? 200
    });
  }, [snapshot, maxDepth, maxNodes, isPlatformSource, platformFieldPaths]);

  const safeOnChange = (next: FieldPickerValue | null) => onChange(next);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">{t('数据源', 'Data Source')}</label>
        {isEmbedded ? (
          <div className="w-full h-8 px-3 flex items-center text-sm rounded-sm border border-input bg-muted/50 text-muted-foreground cursor-not-allowed">
            {isPlatformSource ? (
              <span>{t('平台字段', 'Platform Fields')}</span>
            ) : (
              <span>{selectedDataSourceId || t('(未选择)', '(none)')}</span>
            )}
          </div>
        ) : (
          <select
            value={selectedDataSourceId}
            onChange={(e) => {
              const nextId = e.target.value;
              safeOnChange(nextId ? { dataSourceId: nextId, fieldPath: '' } : null);
            }}
            className="w-full h-8 px-3 text-sm rounded-sm border border-input bg-background focus:ring-1 focus:ring-ring focus:outline-none"
          >
            <option value="">{t('(请选择数据源)', '(select a data source)')}</option>

            {/* Platform Fields Option */}
            {platformFields.length > 0 && (
              <option value="__platform__">
                🔌 {t('平台字段 (Platform Fields)', 'Platform Fields')}
              </option>
            )}

            {/* Regular Data Sources */}
            {dataSourceIds.length > 0 && platformFields.length > 0 && (
              <option disabled>──────────</option>
            )}
            {dataSourceIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">{t('字段', 'Field')}</label>
        <select
          value={selectedFieldPath}
          onChange={(e) => {
            const nextPath = e.target.value;
            safeOnChange(effectiveDataSourceId ? { dataSourceId: effectiveDataSourceId, fieldPath: nextPath } : null);
          }}
          className="w-full h-8 px-3 text-sm rounded-sm border border-input bg-background focus:ring-1 focus:ring-ring focus:outline-none"
          disabled={!effectiveDataSourceId || (dsStatus === 'loading' && !isPlatformSource)}
        >
          <option value="">{t('(请选择字段)', '(select a field)')}</option>
          {isPlatformSource ? (
            // Platform fields with labels
            platformFields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name} ({field.id})
              </option>
            ))
          ) : (
            // Regular data source paths
            paths.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))
          )}
        </select>
        {dsStatus === 'loading' && !isPlatformSource && (
          <p className="text-xs text-muted-foreground">
            {t('数据加载中...', 'Loading data...')}
          </p>
        )}
        {dsStatus === 'error' && dsState?.error && (
          <p className="text-xs text-destructive">
            {t('数据源错误: ', 'Data source error: ')}{dsState.error}
          </p>
        )}
        {dsStatus === 'connected' && paths.length === 0 && snapshot === null && !isPlatformSource && (
          <p className="text-xs text-muted-foreground">
            {t('数据源暂无数据，请检查配置或等待数据推送。', 'No data available. Check config or wait for data.')}
          </p>
        )}
        {truncated && (
          <p className="text-xs text-muted-foreground">
            {t('字段列表已截断（深度/数量限制）。', 'Field list truncated (depth/size limit).')}
          </p>
        )}
        {isPlatformSource && platformFields.length > 0 && selectedFieldPath && (
          <p className="text-xs text-muted-foreground">
            💡 {t('平台字段由外部应用提供', 'Platform field provided by host app')}
          </p>
        )}
      </div>
    </div>
  );
}

export default FieldPicker;
