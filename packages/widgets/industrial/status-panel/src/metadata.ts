/**
 * 工业状态指示面板 - 元数据配置
 * 
 * 支持：
 * - 报警牌（呼吸灯效果）
 * - 设备控制面板（手动/自动 + 开关）
 * - 状态指示灯
 */

export const metadata = {
  id: 'industrial-status-panel',
  name: '状态面板',
  category: 'industrial',
  icon: 'PanelTop',
  version: '1.0.0',
  order: 2,
  resizable: true,
  defaultSize: { width: 160, height: 80 },
  constraints: { minWidth: 100, minHeight: 50 },
} as const;
