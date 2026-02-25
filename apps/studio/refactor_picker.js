const fs = require('fs');

// PlatformFieldPicker
let path = 'f:/coding/thingsvis/apps/studio/src/components/RightPanel/PlatformFieldPicker.tsx';
let txt = fs.readFileSync(path, 'utf8');

if (!txt.includes('useTranslation')) {
    txt = txt.replace(/import React, \{ useMemo \} from \'react\'/, "import React, { useMemo } from 'react';\nimport { useTranslation } from 'react-i18next';");
}
txt = txt.replace(/language\?\:\s*\'zh\'\s*\|\s*\'en\'/g, "");
txt = txt.replace(/language = \'zh\'/g, "");

// find the function signature and inject useTranslation if not there
if (!txt.includes('const { t } = useTranslation')) {
    txt = txt.replace(/export function PlatformFieldPicker\(\{([\s\S]*?)\}: PlatformFieldPickerProps\) \{/, "export function PlatformFieldPicker({$1}: PlatformFieldPickerProps) {\n    const { t } = useTranslation('editor');\n");
}

// Translations
txt = txt.replace(/language === \'zh\' \? \'遥测数据\' : \'Telemetry\'/g, "t('platformPicker.telemetry')");
txt = txt.replace(/language === \'zh\' \? \'属性数据\' : \'Attributes\'/g, "t('platformPicker.attributes')");
txt = txt.replace(/language === \'zh\' \? \'命令\' : \'Commands\'/g, "t('platformPicker.commands')");
txt = txt.replace(/\{language === \'zh\' \? \'暂无平台字段\' : \'No platform fields available\'\}/g, "{t('platformPicker.noFields')}");
txt = txt.replace(/\{language === \'zh\'[\s\S]*?请在ThingsPanel中配置设备物模型[\s\S]*?\'Please configure device model in ThingsPanel\'\}/g, "{t('platformPicker.noFieldsTip')}");
txt = txt.replace(/\{language === \'zh\' \? \'平台字段\' : \'Platform Fields\'\}/g, "{t('platformPicker.title')}");
txt = txt.replace(/\{language === \'zh\'[\s\S]*?点击字段可创建数据源绑定，支持实时数据推送[\s\S]*?\'Click field to create data binding with real-time updates\'\}/g, "{t('platformPicker.bindingTip')}");

fs.writeFileSync(path, txt, 'utf8');

// DataSourceSelector
path = 'f:/coding/thingsvis/apps/studio/src/components/RightPanel/DataSourceSelector.tsx';
txt = fs.readFileSync(path, 'utf8');

if (!txt.includes('useTranslation')) {
    txt = txt.replace(/import React from \'react\';/, "import React from 'react';\nimport { useTranslation } from 'react-i18next';");
}
if (!txt.includes('const { t } = useTranslation')) {
    txt = txt.replace(/export function DataSourceSelector\(\{([\s\S]*?)\}: DataSourceSelectorProps\) \{/, "export function DataSourceSelector({$1}: DataSourceSelectorProps) {\n    const { t } = useTranslation('editor');");
}

txt = txt.replace(/\{label\(\'暂无可用数据源\',\s*\'No data sources available\'\)\}/g, "{t('dataSourceSelector.noDataSources')}");
txt = txt.replace(/\{label\(\'数据源管理器\',\s*\'Data Sources\'\)\}/g, "{t('dataSourceSelector.dataSources')}");
txt = txt.replace(/\{label\(\'平台字段\',\s*\'Platform Fields\'\)\}/g, "{t('dataSourceSelector.platformFields')}");
txt = txt.replace(/onChangeplaceholder/, "onChange,\n    placeholder"); // fix syntax error typo

fs.writeFileSync(path, txt, 'utf8');
console.log('Done script');
