import { useMemo } from 'react';
import type { KernelStore } from '@thingsvis/kernel';
import { useDataSourceRegistry } from '@thingsvis/ui';
import { usePlatformFieldStore } from '@/lib/stores/platformFieldStore';

import { listFieldPaths, type FieldPathInfo } from './fieldPath';

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
  
};


export function FieldPicker({ kernelStore, value, onChange, maxDepth, maxNodes}: Props) {
  const { states } = useDataSourceRegistry(kernelStore);
  const dataSourceIds = useMemo(() => Object.keys(states).sort(), [states]);

  // 🆕 从 Store 订阅平台字段（支持动态更新）
  const platformFields = usePlatformFieldStore((s: { fields: any[] }) => s.fields);
  const hasPlatformFields = platformFields.length > 0;
  // Use controlled value, or default to first data source if none selected
  const selectedDataSourceId = value?.dataSourceId || '';
  const selectedFieldPath = value?.fieldPath || '';

  // 平台字段仅在嵌入模式下由宿主注入，有平台字段即表示处于嵌入模式
  const usePlatformFieldsMode = hasPlatformFields;

  // In embedded mode with platform fields, if no source is selected, default to platform source
  const effectiveDataSourceId = (usePlatformFieldsMode && !selectedDataSourceId) ? '__platform__' : selectedDataSourceId;

  const isPlatformSource = effectiveDataSourceId === '__platform__';

  const dsState = effectiveDataSourceId && !isPlatformSource ? states[effectiveDataSourceId] : null;
  const snapshot = dsState?.data ?? null;
  const dsStatus = dsState?.status ?? 'disconnected';

  // For platform fields, create a virtual path info structure
  const platformPathInfos: FieldPathInfo[] = useMemo(() => {
    if (!isPlatformSource) return [];
    return platformFields.map(f => ({ path: f.id, type: 'string' as const }));
  }, [isPlatformSource, platformFields]);

  const { paths, pathInfos, truncated } = useMemo(() => {
    if (isPlatformSource) {
      return { paths: platformFields.map(f => f.id), pathInfos: platformPathInfos, truncated: false };
    }
    return listFieldPaths(snapshot, {
      maxDepth: maxDepth ?? 5,
      maxNodes: maxNodes ?? 200
    });
  }, [snapshot, maxDepth, maxNodes, isPlatformSource, platformFields, platformPathInfos]);

  // 创建路径到类型的映射，用于快速查找
  const pathTypeMap = useMemo(() => {
    const map = new Map<string, FieldPathInfo['type']>();
    pathInfos.forEach(info => map.set(info.path, info.type));
    return map;
  }, [pathInfos]);

  // 获取类型标记符号
  const getTypeIcon = (type: FieldPathInfo['type']): string => {
    switch (type) {
      case 'object': return '📦';
      case 'array': return '📋';
      case 'string': return 'Ⓢ';
      case 'number': return '#';
      case 'boolean': return '◐';
      case 'null': return '∅';
      default: return '?';
    }
  };

  const safeOnChange = (next: FieldPickerValue | null) => onChange(next);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">{t('binding.dataSource', 'Data Source')}</label>
        {usePlatformFieldsMode ? (
          <div className="w-full h-8 px-3 flex items-center text-sm rounded-sm border border-input bg-muted/50 text-muted-foreground cursor-not-allowed">
            {isPlatformSource ? (
              <span>{t('binding.platformField', 'Platform Fields')}</span>
            ) : (
              <span>{selectedDataSourceId || t('binding.notSelected', '(none)')}</span>
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
            <option value="">{t('binding.selectDataSource', '(select a data source)')}</option>

            {/* Platform Fields Option - 只在有平台字段时显示 */}
            {hasPlatformFields && (
              <option value="__platform__">
                🔌 {t('binding.platformFieldsLabel', 'Platform Fields')}
              </option>
            )}

            {/* Regular Data Sources */}
            {dataSourceIds.length > 0 && hasPlatformFields && (
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
        <label className="text-sm font-medium text-muted-foreground">{t('binding.field', 'Field')}</label>
        <select
          value={selectedFieldPath}
          onChange={(e) => {
            const nextPath = e.target.value;
            safeOnChange(effectiveDataSourceId ? { dataSourceId: effectiveDataSourceId, fieldPath: nextPath } : null);
          }}
          className="w-full h-8 px-3 text-sm rounded-sm border border-input bg-background focus:ring-1 focus:ring-ring focus:outline-none"
          disabled={!effectiveDataSourceId || (dsStatus === 'loading' && !isPlatformSource)}
        >
          <option value="">{t('binding.selectField', '(select a field)')}</option>
          {isPlatformSource ? (
            // Platform fields with labels
            platformFields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name} ({field.id})
              </option>
            ))
          ) : (
            // Regular data source paths with type icons
            paths.map((p) => {
              const type = pathTypeMap.get(p) || 'unknown';
              const icon = getTypeIcon(type);
              // 对象和数组类型添加提示信息
              const isComplexType = type === 'object' || type === 'array';
              return (
                <option key={p} value={p}>
                  {icon} {p}{isComplexType ? t('binding.needChildField', ' (select child)') : ''}
                </option>
              );
            })
          )}
        </select>
        {dsStatus === 'loading' && !isPlatformSource && (
          <p className="text-xs text-muted-foreground">
            {t('common.loadingData', 'Loading data...')}
          </p>
        )}
        {dsStatus === 'error' && dsState?.error && (
          <p className="text-xs text-destructive">
            {t('binding.dataSourceError', 'Data source error: ')}{dsState.error}
          </p>
        )}
        {dsStatus === 'connected' && paths.length === 0 && snapshot === null && !isPlatformSource && (
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
        {/* 警告：选择了对象或数组类型的字段 */}
        {!isPlatformSource && selectedFieldPath && (() => {
          const selectedType = pathTypeMap.get(selectedFieldPath);
          if (selectedType === 'object' || selectedType === 'array') {
            return (
              <p className="text-xs text-amber-600">
                ⚠️ {t(
                  '当前选择的是对象/数组类型，可能会显示 [object Object]。请选择具体的子字段以获取正确的值。',
                  'Selected field is object/array type and may show [object Object]. Please select a specific child field.'
                )}
              </p>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}

export default FieldPicker;
