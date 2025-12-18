import type { PluginMainModule } from '@thingsvis/schema';
import { Spec } from './spec';

export const componentId = 'basic/switch';

export function create(): unknown {
  // 简单示例：返回一个原生 checkbox 元素，供宿主（如 Leafer 容器）挂载。
  const el = document.createElement('input');
  el.type = 'checkbox';
  el.checked = false;
  el.style.width = '18px';
  el.style.height = '18px';
  el.style.cursor = 'pointer';

  el.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    // 在宿主侧你可以监听事件或通过属性传递状态，这里先简单打印。
    console.log('[basic/switch] changed:', checked);
  });

  return el;
}

export const Main: PluginMainModule = {
  componentId,
  create,
  Spec
};

export default Main;


