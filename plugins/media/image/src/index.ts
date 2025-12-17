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
  Spec
};

export default Main;


