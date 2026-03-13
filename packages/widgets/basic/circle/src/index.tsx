/**
 * 圆形组件
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Rect } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { WidgetMainModule, WidgetOverlayContext, PluginOverlayInstance } from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

/**
 * 创建透明占位 Rect
 */
function create(): Rect {
  return new Rect({
    width: 100,
    height: 100,
    fill: 'transparent',
    draggable: true,
    cursor: 'pointer',
  });
}

/**
 * React 圆形组件
 */
const CircleShape: React.FC<Props> = (props) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: props.fill,
      border: props.strokeWidth > 0 ? `${props.strokeWidth}px solid ${props.stroke}` : 'none',
      borderRadius: '50%',
      opacity: props.opacity,
      boxSizing: 'border-box',
    }} />
  );
};

/**
 * 创建 DOM Overlay
 */
function createOverlay(ctx: WidgetOverlayContext): PluginOverlayInstance {
  const element = document.createElement('div');
  element.style.width = '100%';
  element.style.height = '100%';
  element.style.boxSizing = 'border-box';

  let root: Root | null = null;

  const update = (ctx: WidgetOverlayContext) => {
    const defaults = getDefaultProps();
    const props: Props = { ...defaults, ...(ctx.props as Partial<Props>) };
    if (!root) {
      root = createRoot(element);
    }
    root.render(<CircleShape {...props} />);
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

export const Main: WidgetMainModule = {
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  defaultSize: metadata.defaultSize,
  constraints: metadata.constraints,
  resizable: metadata.resizable,
  locales: { zh, en },
  create,
  createOverlay,
  schema: PropsSchema,
  controls,
};

export default Main;
