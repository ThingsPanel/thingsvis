/**
 * 圆形组件主入口
 * 
 * 使用 Leafer Ellipse 原生渲染
 */

import { Ellipse } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { PluginMainModule } from './lib/types';

/**
 * 创建圆形/椭圆 Leafer 节点
 */
function create(): Ellipse {
  const defaults = getDefaultProps();
  return new Ellipse({
    width: 100,
    height: 100,
    fill: defaults.fill,
    stroke: defaults.stroke,
    strokeWidth: defaults.strokeWidth,
    opacity: defaults.opacity,
    draggable: true,
    cursor: 'pointer',
  });
}

/**
 * 更新圆形节点属性
 */
function update(node: Ellipse, props: Partial<Props>): void {
  const defaults = getDefaultProps();
  const merged = { ...defaults, ...props };
  
  node.fill = merged.fill;
  node.stroke = merged.stroke;
  node.strokeWidth = merged.strokeWidth;
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
