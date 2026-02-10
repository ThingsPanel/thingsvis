import { useMemo } from 'react';
import type { KernelStore } from '@thingsvis/kernel';
import { useDataSourceRegistry } from '@thingsvis/ui';
import { resolveEditorServiceConfig } from '@/lib/embedded/service-config';

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
  language?: string;
};

import { isEmbedMode } from '@/embed/embed-mode';

export function FieldPicker({ kernelStore, value, onChange, maxDepth, maxNodes, language }: Props) {
  const { states } = useDataSourceRegistry(kernelStore);
  const dataSourceIds = useMemo(() => Object.keys(states).sort(), [states]);

  // Get platform fields from service config
  // 注意：在可视化嵌入场景 (saveTarget='self') 中，platformFields 为空
  const serviceConfig = resolveEditorServiceConfig();
  const platformFields = serviceConfig.platformFields || [];
  const hasPlatformFields = platformFields.length > 0;

  const t = (zh: string, en: string) => (language === 'zh' ? zh : en);

  // Use controlled value, or default to first data source if none selected
  const selectedDataSourceId = value?.dataSourceId || '';
  const selectedFieldPath = value?.fieldPath || '';

  // Check if selected source is platform fields
  const isEmbedded = isEmbedMode();
  
  // 只有在嵌入模式且有平台字段时才使用平台字段模式
  const usePlatformFieldsMode = isEmbedded && hasPlatformFields;

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
        <label className="text-sm font-medium text-muted-foreground">{t('数据源', 'Data Source')}</label>
        {usePlatformFieldsMode ? (
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

            {/* Platform Fields Option - 只在有平台字段时显示 */}
            {hasPlatformFields && (
              <option value="__platform__">
                🔌 {t('平台字段 (Platform Fields)', 'Platform Fields')}
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
            // Regular data source paths with type icons
            paths.map((p) => {
              const type = pathTypeMap.get(p) || 'unknown';
              const icon = getTypeIcon(type);
              // 对象和数组类型添加提示信息
              const isComplexType = type === 'object' || type === 'array';
              return (
                <option key={p} value={p}>
                  {icon} {p}{isComplexType ? t(' (需选子字段)', ' (select child)') : ''}
                </option>
              );
            })
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
