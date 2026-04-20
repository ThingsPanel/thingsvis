import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Database } from 'lucide-react';
import { resolveEditorServiceConfig } from '@/lib/embedded/service-config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataSourceSelectorProps {
  dataSources: Record<string, any>;
  platformFields?: Array<{ id: string; name: string; type: string; dataType: string }>;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function isHostDataSourceId(id: string) {
  return /^__platform_.+__$/.test(id);
}

export function DataSourceSelector({
  dataSources,
  value = '',
  onChange,
  placeholder,
}: DataSourceSelectorProps) {
  const { t } = useTranslation('editor');
  const isEmbeddedMode = useMemo(() => resolveEditorServiceConfig().mode === 'embedded', []);
  const visibleDataSourceIds = useMemo(
    () =>
      Object.keys(dataSources).filter(
        (id) => id !== '__platform__' && (isEmbeddedMode || !isHostDataSourceId(id)),
      ),
    [dataSources, isEmbeddedMode],
  );
  const hasDataSources = visibleDataSourceIds.length > 0;

  if (!hasDataSources) {
    return (
      <div className="text-xs text-muted-foreground italic p-2 border border-dashed rounded">
        {t('dataSourceSelector.noDataSources')}
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-sm">
        <SelectValue placeholder={placeholder ?? t('dataSourceSelector.selectDataSource')} />
      </SelectTrigger>
      <SelectContent>
        {/* Data Sources Section */}
        {hasDataSources && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 border-b">
              <Database className="h-3 w-3" />
              {t('dataSourceSelector.dataSources')}
            </div>
            {visibleDataSourceIds.map((id) => (
              <SelectItem
                key={id}
                value={`ds.${id}.data`}
                className="text-sm font-mono cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      dataSources[id].status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  />
                  <span className="font-semibold">{id}</span>
                  <span className="text-muted-foreground text-xs">ds.{id}.data</span>
                </div>
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
