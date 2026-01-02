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
const PM25Card: React.FC<Props> = (props) => {
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
      {/* Title */}
      <div style={{
        fontSize: '18px',
        color: props.titleColor,
        fontWeight: 500,
      }}>
        {props.title}
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
