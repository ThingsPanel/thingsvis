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
  Spec
};

export default Main;


