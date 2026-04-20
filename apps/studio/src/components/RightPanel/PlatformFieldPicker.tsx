import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, ChevronRight } from 'lucide-react';
import type { PlatformField } from '@/lib/embedded/service-config';

interface PlatformFieldPickerProps {
  platformFields: PlatformField[];
  onSelectField: (field: PlatformField) => void;
}

/**
 * Platform Field Picker Component
 * Displays available platform fields (e.g., IoT device attributes/telemetry)
 * and allows users to select them for data binding
 */
export function PlatformFieldPicker({ platformFields, onSelectField }: PlatformFieldPickerProps) {
  const { t } = useTranslation('editor');

  // Group fields by dataType
  const groupedFields = useMemo(() => {
    const groups: Record<string, PlatformField[]> = {
      telemetry: [],
      attribute: [],
      command: [],
    };

    platformFields.forEach((field) => {
      const dt = field.dataType as string;
      if (dt && groups[dt]) {
        groups[dt].push(field);
      }
    });

    return groups;
  }, [platformFields]);

  const dataTypeLabels = {
    telemetry: t('platformPicker.telemetry'),
    attribute: t('platformPicker.attributes'),
    command: t('platformPicker.commands'),
  };

  const dataTypeColors = {
    telemetry: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    attribute: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    command: 'bg-green-500/10 text-green-600 border-green-500/20',
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'number':
        return '🔢';
      case 'string':
        return '📝';
      case 'boolean':
        return '✓';
      case 'json':
        return '{}';
      default:
        return '•';
    }
  };

  if (platformFields.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-muted-foreground">
        <Database className="mx-auto h-12 w-12 opacity-20 mb-3" />
        <p className="text-sm">{t('platformPicker.noFields')}</p>
        <p className="text-xs mt-2 opacity-60">{t('platformPicker.noFieldsTip')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-md">
        <Database className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{t('platformPicker.title')}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {platformFields.length}
        </Badge>
      </div>

      {/* Field Groups */}
      {Object.entries(groupedFields).map(([dataType, fields]) => {
        if (fields.length === 0) return null;

        return (
          <div key={dataType} className="space-y-2">
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {dataTypeLabels[dataType as keyof typeof dataTypeLabels]}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-1.5">
              {fields.map((field) => (
                <Card
                  key={field.id}
                  className={`px-3 py-2.5 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 ${dataTypeColors[dataType as keyof typeof dataTypeColors]}`}
                  onClick={() => onSelectField(field)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{getTypeIcon(field.type)}</span>
                        <span className="text-sm font-medium truncate">{field.name}</span>
                        {field.unit && (
                          <Badge variant="outline" className="text-xs font-normal opacity-60">
                            {field.unit}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <code className="px-1.5 py-0.5 bg-muted/50 rounded text-xs">
                          {field.id}
                        </code>
                        <span>•</span>
                        <span className="opacity-60">{field.type}</span>
                      </div>
                      {field.description && (
                        <p className="text-xs text-muted-foreground/80 mt-1.5 line-clamp-1">
                          {field.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-40 flex-shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
