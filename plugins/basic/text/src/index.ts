import { Text } from 'leafer-ui';
import { entry } from './spec';

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
};

export default Main;
