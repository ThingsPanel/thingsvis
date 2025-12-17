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
  Spec
};

export default Main;


