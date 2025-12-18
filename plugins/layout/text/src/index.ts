import type { PluginMainModule } from '@thingsvis/schema';
import { Text } from 'leafer-ui';
import { Spec } from './spec';

export const componentId = 'layout/text';

export function create() {
  return new Text({
    text: 'Hello ThingsVis',
    fontSize: 24,
    fill: '#000'
  });
}

export const Main: PluginMainModule = {
  componentId,
  create,
  Spec,
  // Layout 文本组件的 props Schema
  schema: {
    props: {
      text: {
        type: 'string',
        default: 'Hello ThingsVis',
        description: '显示的文本内容'
      },
      fontSize: {
        type: 'number',
        default: 24,
        description: '字号（像素）'
      },
      fill: {
        type: 'string',
        default: '#000000',
        description: '文字颜色'
      }
    }
  }
};

export default Main;


