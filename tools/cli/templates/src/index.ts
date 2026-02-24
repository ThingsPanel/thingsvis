/**
 * 组件主入口
 * 
 * 使用 @thingsvis/widget-sdk 构建
 */

import { Rect } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { WidgetMainModule } from '@thingsvis/schema';

/**
 * 创建组件渲染实例
 */
function create(): Rect {
  const defaults = getDefaultProps();
  return new Rect({
    width: 100,
    height: 100,
    fill: defaults.fill,
    opacity: defaults.opacity,
    draggable: true,
    cursor: 'pointer',
  });
}

/**
 * 更新组件属性
 */
function update(rect: Rect, props: Props) {
  rect.fill = props.fill;
  rect.opacity = props.opacity;
}

/**
 * 插件导出入口
 */
export const Main: WidgetMainModule = {
  ...metadata,
  schema: PropsSchema,
  controls,
  create,
  update,
};

export default Main;
