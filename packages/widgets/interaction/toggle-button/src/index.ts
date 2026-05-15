import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import {
  defineWidget,
  resolveLayeredColor,
  resolveWidgetColors,
  type WidgetColors,
  type WidgetOverlayContext,
} from '@thingsvis/widget-sdk';

import zh from './locales/zh.json';
import en from './locales/en.json';

function coerceBoolean(value: unknown): boolean {
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
}

function renderToggleButton(
  element: HTMLElement,
  props: Props,
  colors: WidgetColors,
  checked: boolean,
  onToggle: () => void,
): void {
  const bgColor = resolveLayeredColor({
    instance: checked ? props.onColor : props.offColor,
    theme: checked ? colors.primary : colors.axis,
    fallback: checked ? colors.primary : colors.axis,
  });
  const textColor = resolveLayeredColor({
    instance: checked ? props.onTextColor : props.offTextColor,
    theme: colors.fg,
    fallback: '#ffffff',
  });
  const label = checked ? props.onLabel : props.offLabel;

  element.style.cssText = `
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: inherit;
    font-family: Inter, Noto Sans SC, Noto Sans, sans-serif;
  `;

  element.innerHTML = `
    <button type="button" data-tv-toggle-btn style="
      width: 100%;
      height: 100%;
      font-size: ${props.fontSize}px;
      font-weight: 500;
      font-family: inherit;
      border-radius: ${props.borderRadius}px;
      cursor: ${props.disabled ? 'not-allowed' : 'pointer'};
      opacity: ${props.disabled ? 0.5 : 1};
      transition: background 0.15s, color 0.15s, opacity 0.15s;
      border: none;
      background: ${bgColor};
      color: ${textColor};
      box-sizing: border-box;
      outline: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 16px;
    " ${props.disabled ? 'disabled' : ''}>${label}</button>
  `;

  const btn = element.querySelector<HTMLButtonElement>('[data-tv-toggle-btn]');
  if (btn) {
    btn.addEventListener('click', () => {
      if (!props.disabled) onToggle();
    });
  }
}

export const Main = defineWidget({
  id: metadata.id,
  name: metadata.name,
  category: metadata.category,
  icon: metadata.icon,
  version: metadata.version,
  defaultSize: metadata.defaultSize,
  constraints: metadata.constraints,
  resizable: metadata.resizable,
  locales: { zh, en },
  schema: PropsSchema,
  controls,

  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    let currentProps = props;
    let colors = resolveWidgetColors(element);
    let internalChecked = coerceBoolean(props.value);

    const handleToggle = () => {
      if (currentProps.confirmToggle) {
        if (!confirm(currentProps.confirmMessage)) return;
      }
      internalChecked = !internalChecked;
      ctx.emit?.('change', internalChecked);
      renderToggleButton(element, currentProps, colors, internalChecked, handleToggle);
    };

    renderToggleButton(element, currentProps, colors, internalChecked, handleToggle);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        colors = resolveWidgetColors(element);
        renderToggleButton(element, currentProps, colors, internalChecked, handleToggle);
      });
      ro.observe(element);
    }

    return {
      update: (newProps: Props) => {
        currentProps = newProps;
        if (newProps.value !== undefined && newProps.value !== null) {
          internalChecked = coerceBoolean(newProps.value);
        }
        colors = resolveWidgetColors(element);
        renderToggleButton(element, currentProps, colors, internalChecked, handleToggle);
      },
      destroy: () => {
        ro?.disconnect();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
