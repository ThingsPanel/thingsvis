/**
 * PM2.5 指标卡组件
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Rect } from 'leafer-ui';
import { ClipboardList } from 'lucide-react';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { PluginMainModule, PluginOverlayContext, PluginOverlayInstance } from './lib/types';

/**
 * 创建透明占位 Rect
 */
function create(): Rect {
  return new Rect({
    width: 300,
    height: 150,
    fill: 'transparent',
    draggable: true,
    cursor: 'pointer',
  });
}

/**
 * React 组件
 */
/**
 * 判断状态是否在线
 * 支持: true, 1, 'online', 'true', '1' 等值表示在线
 */
function isOnline(status: boolean | number | string): boolean {
  if (typeof status === 'boolean') return status;
  if (typeof status === 'number') return status === 1;
  const s = String(status).toLowerCase();
  return s === 'online' || s === 'true' || s === '1';
}

const PM25Card: React.FC<Props> = (props) => {
  const online = isOnline(props.status);
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: props.backgroundColor,
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: props.fontFamily,
      boxSizing: 'border-box',
    }}>
      {/* Title & Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '18px',
          color: props.titleColor,
          fontWeight: 500,
        }}>
          {props.title}
        </span>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: '12px',
          color: online ? '#52c41a' : '#999',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: online ? '#52c41a' : '#999',
            marginRight: '4px',
          }} />
          {online ? '在线' : '离线'}
        </span>
      </div>

      {/* Content */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: '10px',
      }}>
        {/* Icon */}
        <div style={{ color: props.iconColor }}>
          <ClipboardList size={32} strokeWidth={1.5} />
        </div>

        {/* Value & Unit */}
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{
            fontSize: '48px',
            color: props.valueColor,
            fontWeight: 400,
            lineHeight: 1,
          }}>
            {props.value}
          </span>
          <span style={{
            fontSize: '16px',
            color: props.unitColor,
            marginLeft: '4px',
            marginBottom: '6px',
          }}>
            {props.unit}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * 创建 DOM Overlay
 */
function createOverlay(ctx: PluginOverlayContext): PluginOverlayInstance {
  const element = document.createElement('div');
  let root: Root | null = null;

  const update = (ctx: PluginOverlayContext) => {
    const defaults = getDefaultProps();
    const props: Props = { ...defaults, ...(ctx.props as Partial<Props>) };
    if (!root) {
      root = createRoot(element);
    }
    root.render(<PM25Card {...props} />);
  };

  // Initial render
  if (ctx.props) {
    update(ctx);
  }

  return {
    element,
    update,
    destroy: () => {
      if (root) {
        root.unmount();
        root = null;
      }
    },
  };
}

export const Main: PluginMainModule = {
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  create,
  createOverlay,
  schema: PropsSchema,
  controls,
};

export default Main;
