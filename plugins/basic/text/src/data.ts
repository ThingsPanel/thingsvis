import { DataBinding, DataSource } from '@thingsvis/schema';

/**
 * 默认数据绑定配置
 * 当组件拖入画布时，Studio 会根据此配置自动关联数据源
 */
export const defaultDataBinding: DataBinding[] = [
  {
    targetProp: 'text',
    expression: '{{ ds.mock_text.data.text }}'
  }
];

/**
 * 演示/开发用的模拟数据源
 */
export const mockDataSource: DataSource = {
  id: 'mock_text',
  name: '演示文本数据源',
  type: 'STATIC',
  config: {
    value: {
      text: '这是来自数据源的动态文本'
    }
  }
};

