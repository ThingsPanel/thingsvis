import React from 'react';
import { Database, Zap } from 'lucide-react';
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
    language: 'zh' | 'en';
    placeholder?: string;
}

export function DataSourceSelector({
    dataSources,
    platformFields = [],
    value = '',
    onChange,
    language,
    placeholder
}: DataSourceSelectorProps) {
    const label = (zh: string, en: string) => language === 'zh' ? zh : en;

    const hasDataSources = Object.keys(dataSources).length > 0;
    const hasPlatformFields = platformFields.length > 0;

    if (!hasDataSources && !hasPlatformFields) {
        return (
            <div className="text-xs text-muted-foreground italic p-2 border border-dashed rounded">
                {label('暂无可用数据源', 'No data sources available')}
            </div>
        );
    }

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-8 text-sm">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {/* Data Sources Section */}
                {hasDataSources && (
                    <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 border-b">
                            <Database className="h-3 w-3" />
                            {label('数据源管理器', 'Data Sources')}
                        </div>
                        {Object.keys(dataSources).map((id) => (
                            <SelectItem key={id} value={`ds.${id}.data`} className="text-sm font-mono cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${dataSources[id].status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
                                        }`} />
                                    <span className="font-semibold">{id}</span>
                                    <span className="text-muted-foreground text-xs">ds.{id}.data</span>
                                </div>
                            </SelectItem>
                        ))}
                    </>
                )}

                {/* Platform Fields Section */}
                {hasPlatformFields && (
                    <>
                        <div className={`px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2 border-b ${hasDataSources ? 'mt-2' : ''}`}>
                            <Zap className="h-3 w-3" />
                            {label('平台字段', 'Platform Fields')}
                        </div>
                        {platformFields.map((field) => (
                            <SelectItem key={field.id} value={`platform.${field.id}`} className="text-sm font-mono cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span className="font-semibold">{field.name}</span>
                                    <span className="text-muted-foreground text-xs">platform.{field.id}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </>
                )}
            </SelectContent>
        </Select>
    );
}
