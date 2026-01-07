import { Rect } from 'leafer-ui';
import { metadata } from './metadata';
import { PropsSchema, getDefaultProps, type Props } from './schema';
import { controls } from './controls';
import type { PluginMainModule, PluginOverlayContext, PluginOverlayInstance } from './lib/types';

function create(): Rect {
  return new Rect({
    width: 220,
    height: 120,
    fill: 'transparent',
    draggable: true,
    cursor: 'pointer'
  });
}

function render(element: HTMLElement, props: Props) {
  element.innerHTML = '';

  const root = document.createElement('div');
  root.style.display = 'flex';
  root.style.flexDirection = 'column';
  root.style.gap = '6px';
  root.style.padding = '12px';
  root.style.borderRadius = '10px';
  root.style.background = props.backgroundColor;
  root.style.boxSizing = 'border-box';
  root.style.minWidth = '220px';

  const title = document.createElement('div');
  title.textContent = props.label;
  title.style.fontSize = '12px';
  title.style.opacity = '0.8';
  title.style.color = props.textColor;

  const valueRow = document.createElement('div');
  valueRow.style.display = 'flex';
  valueRow.style.alignItems = 'baseline';
  valueRow.style.gap = '6px';

  const value = document.createElement('div');
  value.textContent = props.value;
  value.style.fontSize = '32px';
  value.style.fontWeight = '700';
  value.style.color = props.accentColor;

  const unit = document.createElement('div');
  unit.textContent = props.unit;
  unit.style.fontSize = '12px';
  unit.style.opacity = '0.8';
  unit.style.color = props.textColor;

  valueRow.appendChild(value);
  valueRow.appendChild(unit);

  root.appendChild(title);
  root.appendChild(valueRow);

  element.appendChild(root);
}

function createOverlay(ctx: PluginOverlayContext): PluginOverlayInstance {
  const element = document.createElement('div');
  element.style.display = 'inline-flex';
  element.style.width = 'fit-content';
  element.style.height = 'fit-content';
  element.style.pointerEvents = 'none';
  element.style.userSelect = 'none';

  const defaults = getDefaultProps();
  let currentProps: Props = { ...defaults, ...(ctx.props as Partial<Props>) };

  render(element, currentProps);

  return {
    element,
    update: (nextCtx: PluginOverlayContext) => {
      currentProps = { ...currentProps, ...(nextCtx.props as Partial<Props>) };
      render(element, currentProps);
    },
    destroy: () => {
      // host cleans up DOM
    }
  };
}

export const Main: PluginMainModule = {
  ...metadata,
  schema: PropsSchema,
  controls,
  create,
  createOverlay
};

export default Main;
