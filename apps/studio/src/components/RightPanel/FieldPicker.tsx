import React, { useMemo } from 'react';
import type { KernelStore } from '@thingsvis/kernel';
import { useDataSourceRegistry } from '@thingsvis/ui';

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

export function FieldPicker({ kernelStore, value, onChange, maxDepth, maxNodes, language }: Props) {
  const { states } = useDataSourceRegistry(kernelStore);
  const dataSourceIds = useMemo(() => Object.keys(states).sort(), [states]);

  const t = (zh: string, en: string) => (language === 'zh' ? zh : en);

  // Use controlled value, or default to first data source if none selected
  const selectedDataSourceId = value?.dataSourceId || '';
  const selectedFieldPath = value?.fieldPath || '';

  const dsState = selectedDataSourceId ? states[selectedDataSourceId] : null;
  const snapshot = dsState?.data ?? null;
  const dsStatus = dsState?.status ?? 'disconnected';

  const { paths, truncated } = useMemo(() => {
    return listFieldPaths(snapshot, {
      maxDepth: maxDepth ?? 5,
      maxNodes: maxNodes ?? 200
    });
  }, [snapshot, maxDepth, maxNodes]);

  const safeOnChange = (next: FieldPickerValue | null) => onChange(next);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">{t('数据源', 'Data Source')}</label>
        <select
          value={selectedDataSourceId}
          onChange={(e) => {
            const nextId = e.target.value;
            safeOnChange(nextId ? { dataSourceId: nextId, fieldPath: '' } : null);
          }}
          className="w-full h-8 px-3 text-sm rounded-sm border border-input bg-background focus:ring-1 focus:ring-ring focus:outline-none"
        >
          <option value="">{t('(请选择数据源)', '(select a data source)')}</option>
          {dataSourceIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">{t('字段', 'Field')}</label>
        <select
          value={selectedFieldPath}
          onChange={(e) => {
            const nextPath = e.target.value;
            safeOnChange(selectedDataSourceId ? { dataSourceId: selectedDataSourceId, fieldPath: nextPath } : null);
          }}
          className="w-full h-8 px-3 text-sm rounded-sm border border-input bg-background focus:ring-1 focus:ring-ring focus:outline-none"
          disabled={!selectedDataSourceId || dsStatus === 'loading'}
        >
          <option value="">{t('(请选择字段)', '(select a field)')}</option>
          {paths.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {dsStatus === 'loading' && (
          <p className="text-xs text-muted-foreground">
            {t('数据加载中...', 'Loading data...')}
          </p>
        )}
        {dsStatus === 'error' && dsState?.error && (
          <p className="text-xs text-destructive">
            {t('数据源错误: ', 'Data source error: ')}{dsState.error}
          </p>
        )}
        {dsStatus === 'connected' && paths.length === 0 && snapshot === null && (
          <p className="text-xs text-muted-foreground">
            {t('数据源暂无数据，请检查配置或等待数据推送。', 'No data available. Check config or wait for data.')}
          </p>
        )}
        {truncated && (
          <p className="text-xs text-muted-foreground">
            {t('字段列表已截断（深度/数量限制）。', 'Field list truncated (depth/size limit).')}
          </p>
        )}
      </div>
    </div>
  );
}

export default FieldPicker;
