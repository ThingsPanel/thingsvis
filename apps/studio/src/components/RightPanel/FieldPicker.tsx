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
};

export function FieldPicker({ kernelStore, value, onChange, maxDepth, maxNodes }: Props) {
  const { states } = useDataSourceRegistry(kernelStore);
  const dataSourceIds = useMemo(() => Object.keys(states).sort(), [states]);

  const selectedDataSourceId = value?.dataSourceId ?? (dataSourceIds[0] ?? '');
  const selectedFieldPath = value?.fieldPath ?? '';

  const snapshot = selectedDataSourceId ? states[selectedDataSourceId]?.data : null;

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
        <label className="text-sm font-medium text-muted-foreground">Data Source</label>
        <select
          value={selectedDataSourceId}
          onChange={(e) => {
            const nextId = e.target.value;
            safeOnChange(nextId ? { dataSourceId: nextId, fieldPath: '' } : null);
          }}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:ring-1 focus:ring-ring focus:outline-none"
        >
          {dataSourceIds.length === 0 && <option value="">(no data sources)</option>}
          {dataSourceIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-muted-foreground">Field</label>
        <select
          value={selectedFieldPath}
          onChange={(e) => {
            const nextPath = e.target.value;
            safeOnChange(selectedDataSourceId ? { dataSourceId: selectedDataSourceId, fieldPath: nextPath } : null);
          }}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:ring-1 focus:ring-ring focus:outline-none"
          disabled={!selectedDataSourceId}
        >
          <option value="">(select a field)</option>
          {paths.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {truncated && (
          <p className="text-xs text-muted-foreground">
            Field list truncated (depth/size limit).
          </p>
        )}
      </div>
    </div>
  );
}

export default FieldPicker;
