import type { PluginMainModule } from '@thingsvis/schema';
import { Image } from 'leafer-ui';
import { Spec } from './spec';

export const componentId = 'media/image';

export function create() {
  return new Image({
    url: 'https://picsum.photos/200/120',
    width: 200,
    height: 120
  });
}

export const Main: PluginMainModule = {
  componentId,
  create,
  Spec,
  // 图片组件的 props Schema
  schema: {
    props: {
      url: {
        type: 'string',
        default: 'https://picsum.photos/200/120',
        description: '图片地址'
      },
      width: {
        type: 'number',
        default: 200,
        description: '宽度（像素）'
      },
      height: {
        type: 'number',
        default: 120,
        description: '高度（像素）'
      }
    }
  }
};

export default Main;


