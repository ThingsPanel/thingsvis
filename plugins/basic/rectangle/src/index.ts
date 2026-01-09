/**
 * 矩形组件主入口
 * 
 * 使用 Leafer Rect 原生渲染
 */

import { Rect } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { PluginMainModule } from './lib/types';

/**
 * 创建矩形 Leafer 节点
 */
function create(): Rect {
  const defaults = getDefaultProps();
  return new Rect({
    width: 120,
    height: 80,
    fill: defaults.fill,
    stroke: defaults.stroke,
    strokeWidth: defaults.strokeWidth,
    cornerRadius: defaults.cornerRadius,
    opacity: defaults.opacity,
    draggable: true,
    cursor: 'pointer',
  });
}

/**
 * 更新矩形节点属性
 */
function update(node: Rect, props: Partial<Props>): void {
  const defaults = getDefaultProps();
  const merged = { ...defaults, ...props };
  
  node.fill = merged.fill;
  node.stroke = merged.stroke;
  node.strokeWidth = merged.strokeWidth;
  node.cornerRadius = merged.cornerRadius;
  node.opacity = merged.opacity;
}

/**
 * 导出插件主模块
 */
const Main: PluginMainModule & { update: typeof update } = {
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  create,
  update,
  schema: PropsSchema,
  controls,
};

export default Main;
