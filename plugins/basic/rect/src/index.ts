import type { PluginMainModule } from '@thingsvis/schema';
import { Rect } from 'leafer-ui';
import { Spec } from './spec';

export const componentId = 'basic/rect';

export function create() {
  return new Rect({
    width: 100,
    height: 60,
    fill: '#1677ff'
  });
}

export const Main: PluginMainModule = {
  componentId,
  create,
  Spec,
  // 简单示例 Schema：声明一个可配置的 fill 颜色
  schema: {
    props: {
      fill: {
        type: 'string',
        default: '#1677ff',
        description: '矩形填充颜色'
      }
    }
  }
};

export default Main;


