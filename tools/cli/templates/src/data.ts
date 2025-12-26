import { DataBinding, DataSource } from '@thingsvis/schema';

/**
 * 默认数据绑定配置
 */
export const defaultDataBinding: DataBinding[] = [
  // { targetProp: 'someProp', expression: '{{ ds.id.data.path }}' }
];

/**
 * 开发调试用的模拟数据源
 */
export const mockDataSource: DataSource = {
  id: 'mock_data',
  name: '模拟数据源',
  type: 'STATIC',
  config: {
    value: {}
  }
};

