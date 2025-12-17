import type { PluginMainModule } from '@thingsvis/schema';
import { Spec } from './spec';

export const componentId = '{{COMPONENT_ID}}';

export function create(): unknown {
  // TODO: replace with a real Leafer element (Rect/Text/Image/etc)
  return {};
}

export const Main: PluginMainModule = {
  componentId,
  create,
  Spec
};

export default Main;


