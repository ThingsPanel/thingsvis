/**
 * 文本组件主入口
 * 
 * 📝 开发指南：
 * - create(): 创建 Leafer UI 节点实例
 * - Main: 导出的插件模块，包含元数据、Schema、控件配置
 * 
 * 💡 提示：
 * - create() 返回的节点会被 Kernel 管理生命周期
 * - 属性更新由 Kernel 的 PropertyResolver 处理，无需在此处理
 * - 如需 DOM Overlay（ECharts/HTML），使用 createOverlay 替代
 */

import { Text } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps } from './schema';
import { controls } from './controls';
import type { PluginMainModule } from './lib/types';

/**
 * 创建文本组件实例
 * 
 * @returns Leafer Text 节点
 */
function create(): Text {
  const defaults = getDefaultProps();
  
  return new Text({
    text: defaults.text,
    fontSize: defaults.fontSize,
    fill: defaults.fill,
    fontWeight: defaults.fontWeight,
    textAlign: defaults.textAlign,
    fontFamily: defaults.fontFamily,
    draggable: true,
    cursor: 'pointer',
  });
}

/**
 * 插件主模块
 * 
 * 导出给宿主应用（Studio/Preview）使用
 */
export const Main: PluginMainModule = {
  ...metadata,
  schema: PropsSchema,
  controls,
  create,
};

export default Main;
