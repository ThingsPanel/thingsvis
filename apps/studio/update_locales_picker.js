const fs = require('fs');
const zhLocalePath = 'f:/coding/thingsvis/apps/studio/src/i18n/locales/zh/editor.json';
const enLocalePath = 'f:/coding/thingsvis/apps/studio/src/i18n/locales/en/editor.json';

const zhData = JSON.parse(fs.readFileSync(zhLocalePath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enLocalePath, 'utf8'));

const newZh = {
    platformPicker: {
        telemetry: '遥测数据',
        attributes: '属性数据',
        commands: '命令',
        noFields: '暂无平台字段',
        noFieldsTip: '请在ThingsPanel中配置设备物模型',
        title: '平台字段',
        bindingTip: '点击字段可创建数据源绑定，支持实时数据推送'
    },
    dataSourceSelector: {
        noDataSources: '暂无可用数据源',
        dataSources: '数据源管理器',
        platformFields: '平台字段'
    }
};

const newEn = {
    platformPicker: {
        telemetry: 'Telemetry',
        attributes: 'Attributes',
        commands: 'Commands',
        noFields: 'No platform fields available',
        noFieldsTip: 'Please configure device model in ThingsPanel',
        title: 'Platform Fields',
        bindingTip: 'Click field to create data binding with real-time updates'
    },
    dataSourceSelector: {
        noDataSources: 'No data sources available',
        dataSources: 'Data Sources',
        platformFields: 'Platform Fields'
    }
};

Object.assign(zhData, newZh);
Object.assign(enData, newEn);

fs.writeFileSync(zhLocalePath, JSON.stringify(zhData, null, 4));
fs.writeFileSync(enLocalePath, JSON.stringify(enData, null, 4));
console.log('Locales updated.');
