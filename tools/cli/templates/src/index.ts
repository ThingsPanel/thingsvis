import { Rect } from 'leafer-ui';
import { entry } from './spec';

/**
 * 创建组件渲染实例
 */
export function create() {
  return new Rect({
    width: 100,
    height: 100,
    fill: '#6965db',
    draggable: true,
  });
}

/**
 * 插件导出入口
 */
export const Main = {
  ...entry,
  create,
};

export default Main;
