import { Text } from 'leafer-ui';
import { entry } from './spec';

/**
 * Plugin Main Module Type (inline definition for plugin independence)
 * 插件主模块类型（内联定义，保证插件独立性）
 * 
 * NOTE: Plugins MUST NOT import from @thingsvis/* packages.
 */
type PluginMainModule = {
  id: string;
  name?: string;
  category?: string;
  icon?: string;
  version?: string;
  create: () => unknown;
  schema?: any;
  controls?: any;
};

/**
 * 创建文本组件实例
 */
export function create() {
  // 初始渲染：使用默认值
  return new Text({
    text: '点击输入文字内容',
    fontSize: 16,
    fill: '#000000',
    draggable: true,
    cursor: 'pointer',
  });
}

export const Main = {
  ...entry,
  create,
} satisfies PluginMainModule;

export default Main;
