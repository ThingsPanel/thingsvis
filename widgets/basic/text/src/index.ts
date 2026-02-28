/**
 * 文本组件主入口 (Overlay 模板)
 * 
 * 📝 使用 @thingsvis/widget-sdk 重构
 * 
 * 支持属性：
 * - 字体：fontSize, fontFamily, fontWeight, fontStyle
 * - 排版：textAlign, verticalAlign, lineHeight, letterSpacing, textDecoration
 * - 颜色：fill, backgroundColor, opacity
 * - 阴影：textShadow*
 * - 边框：borderWidth, borderColor, borderStyle, borderRadius, padding
 * 
 * ✨ 双击编辑功能：
 * - 双击文本进入编辑模式
 * - 编辑时 emit('edit:start') 通知编辑器禁用拖拽
 * - 失焦或按 Enter 退出编辑模式
 * - emit('edit:end', { text }) 通知编辑器并提交新文本
 */

import { Rect } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { WidgetMainModule, WidgetOverlayContext, PluginOverlayInstance } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';


/**
 * 创建透明占位 Rect（用于 Leafer 层选择交互）
 */
function create(): Rect {
  return new Rect({
    width: 160,
    height: 40,
    fill: 'rgba(200,200,200,0.05)', // 轻微透明背景便于选择
    stroke: {
      width: 1,
      color: 'rgba(150,150,150,0.2)', // 轻微边框便于识别
    },
    draggable: true,
    cursor: 'pointer',
  });
}

/**
 * 应用样式到 DOM 元素
 */
function applyStyles(element: HTMLElement, props: Props, isEditing: boolean = false) {
  // 编辑模式切换 pointer-events
  if (isEditing) {
    element.style.pointerEvents = 'auto';
    element.style.cursor = 'text';
    element.style.userSelect = 'text';
  } else {
    // 非编辑模式也保留 auto，让双击事件可以触发
    element.style.pointerEvents = 'auto';
    element.style.cursor = 'pointer';
    element.style.userSelect = 'none';
  }
  
  // 字体属性
  element.style.fontSize = `${props.fontSize}px`;
  element.style.fontFamily = props.fontFamily;
  element.style.fontWeight = props.fontWeight;
  element.style.fontStyle = props.fontStyle;
  
  // 排版属性
  element.style.textAlign = props.textAlign;
  element.style.lineHeight = String(props.lineHeight);
  element.style.letterSpacing = props.letterSpacing ? `${props.letterSpacing}px` : 'normal';
  element.style.textDecoration = props.textDecoration;
  
  // 颜色属性
  element.style.color = props.fill;
  element.style.backgroundColor = props.backgroundColor || 'transparent';
  element.style.opacity = String(props.opacity);
  
  // 阴影属性
  if (props.textShadowEnabled) {
    element.style.textShadow = `${props.textShadowOffsetX}px ${props.textShadowOffsetY}px ${props.textShadowBlur}px ${props.textShadowColor}`;
  } else {
    element.style.textShadow = 'none';
  }
  
  // 其他属性
  element.style.padding = props.padding ? `${props.padding}px` : '0';
  
  // 文本换行模式
  element.style.wordBreak = 'break-word';
  element.style.whiteSpace = isEditing ? 'pre-wrap' : 'pre-wrap';
  
  // 编辑模式下添加边框提示
  if (isEditing) {
    element.style.outline = '2px solid #0066ff';
    element.style.outlineOffset = '2px';
  } else {
    element.style.outline = 'none';
  }
}

/**
 * 获取 flex 对齐方式
 */
function getFlexAlign(align: Props['textAlign']): string {
  switch (align) {
    case 'center': return 'center';
    case 'right': return 'flex-end';
    case 'justify': return 'space-between';
    default: return 'flex-start';
  }
}

function getVerticalAlign(align: Props['verticalAlign']): string {
  switch (align) {
    case 'middle': return 'center';
    case 'bottom': return 'flex-end';
    default: return 'flex-start';
  }
}

/**
 * 创建文本 Overlay 实例
 */
function createOverlay(ctx: WidgetOverlayContext): PluginOverlayInstance {
  // 创建容器元素
  const element = document.createElement('div');
  element.style.display = 'inline-flex';
  element.style.width = 'fit-content';
  element.style.height = 'fit-content';
  element.style.overflow = 'visible';
  // 默认启用 pointer events 以支持双击编辑等功能
  element.style.pointerEvents = 'auto';
  element.style.userSelect = 'none';
  element.style.boxSizing = 'border-box';
  element.dataset.thingsvisOverlay = 'basic-text';
  
  // 合并默认值和传入的 props
  const defaults = getDefaultProps();
  let currentProps: Props = { ...defaults, ...(ctx.props as Partial<Props>) };
  
  // 创建内部文本元素
  const textEl = document.createElement('div');
  textEl.style.width = 'fit-content';
  textEl.style.height = 'fit-content';
  textEl.style.boxSizing = 'border-box';
  textEl.style.minWidth = '20px'; // 最小宽度便于点击
  textEl.style.minHeight = '1em'; // 最小高度便于点击
  textEl.dataset.thingsvisMeasure = '1';
  textEl.textContent = currentProps.text;
  element.appendChild(textEl);
  
  // 应用初始样式
  applyStyles(textEl, currentProps, false);
  element.style.justifyContent = getFlexAlign(currentProps.textAlign);
  element.style.alignItems = getVerticalAlign(currentProps.verticalAlign);
  
  // 编辑状态
  let isEditing = false;
  let originalText = currentProps.text;
  
  /**
   * 进入编辑模式
   */
  function enterEditMode() {
    // eslint-disable-next-line no-console
    console.log('[Text Widget] enterEditMode called', { isEditing, mode: ctx.mode });
    
    if (isEditing) {
      // eslint-disable-next-line no-console
      console.log('[Text Widget] Already editing, skipping');
      return;
    }
    
    // 只有编辑模式才启用编辑（临时禁用检查以便调试）
    // if (ctx.mode !== 'edit') {
    //   // eslint-disable-next-line no-console
    //   console.log('[Text Widget] Not in edit mode, cannot enter edit mode');
    //   return;
    // }
    
    isEditing = true;
    originalText = currentProps.text;
    
    // 通知编辑器开始编辑（禁用拖拽）
    // eslint-disable-next-line no-console
    console.log('[Text Widget] Emitting edit:start');
    ctx.emit('edit:start', { type: 'basic-text' });
    
    // 应用编辑样式
    applyStyles(textEl, currentProps, true);
    
    // 启用 contentEditable
    textEl.contentEditable = 'true';
    textEl.focus();
    
    // 选中全部文本
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(textEl);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  /**
   * 退出编辑模式
   */
  function exitEditMode(save: boolean = true) {
    if (!isEditing) return;
    
    isEditing = false;
    
    // 禁用 contentEditable
    textEl.contentEditable = 'false';
    
    // 应用非编辑样式
    applyStyles(textEl, currentProps, false);
    
    if (save) {
      // 获取新文本
      const newText = textEl.textContent || '';
      
      // 如果文本有变化，通知编辑器
      if (newText !== originalText) {
        ctx.emit('edit:end', { 
          type: 'basic-text',
          text: newText,
          changed: true 
        });
      } else {
        ctx.emit('edit:end', { 
          type: 'basic-text',
          changed: false 
        });
      }
    } else {
      // 取消编辑，恢复原文本
      textEl.textContent = originalText;
      ctx.emit('edit:end', { 
        type: 'basic-text',
        changed: false,
        cancelled: true 
      });
    }
  }
  
  // 双击事件 - 进入编辑模式
  textEl.addEventListener('dblclick', (e) => {
    // eslint-disable-next-line no-console
    console.log('[Text Widget] Double click detected', { mode: ctx.mode, isEditing });
    e.stopPropagation();
    e.preventDefault();
    enterEditMode();
  });
  
  // 添加单击调试（用于验证事件是否到达）
  textEl.addEventListener('click', (e) => {
    // eslint-disable-next-line no-console
    console.log('[Text Widget] Click detected', { mode: ctx.mode, target: e.target });
  });
  
  // 阻止 mousedown 冒泡，防止触发拖拽
  textEl.addEventListener('mousedown', (e) => {
    if (isEditing) {
      e.stopPropagation();
    }
  });
  
  // 失焦事件 - 保存并退出编辑
  textEl.addEventListener('blur', () => {
    if (isEditing) {
      exitEditMode(true);
    }
  });
  
  // 键盘事件
  textEl.addEventListener('keydown', (e) => {
    if (!isEditing) return;
    
    if (e.key === 'Enter' && !e.shiftKey) {
      // Enter 保存并退出（非 Shift+Enter）
      e.preventDefault();
      textEl.blur();
    } else if (e.key === 'Escape') {
      // Escape 取消编辑
      e.preventDefault();
      exitEditMode(false);
    }
  });
  
  return {
    element,
    
    /**
     * 属性更新时调用
     */
    update: (newCtx: WidgetOverlayContext) => {
      // 更新闭包中的 ctx，这样 enterEditMode 等函数可以访问最新的 mode
      // eslint-disable-next-line no-console
      console.log('[Text Widget] update called', { 
        oldMode: ctx.mode, 
        newMode: newCtx.mode,
        hasEmit: !!newCtx.emit 
      });
      (ctx as any).mode = newCtx.mode;
      (ctx as any).emit = newCtx.emit;
      
      currentProps = { ...currentProps, ...(newCtx.props as Partial<Props>) };
      
      // 如果不在编辑模式，更新文本内容
      if (!isEditing) {
        textEl.textContent = currentProps.text;
        applyStyles(textEl, currentProps, false);
      }
      
      element.style.justifyContent = getFlexAlign(currentProps.textAlign);
      element.style.alignItems = getVerticalAlign(currentProps.verticalAlign);
    },
    
    /**
     * 组件销毁时调用
     */
    destroy: () => {
      // 如果在编辑模式，先退出
      if (isEditing) {
        exitEditMode(false);
      }
    },
  };
}

/**
 * 插件主模块
 */
export const Main: WidgetMainModule = {
  locales: { zh, en },
  ...metadata,
  schema: PropsSchema,
  controls,
  create,
  createOverlay,
};

export default Main;
