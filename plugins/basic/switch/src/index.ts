import type { PluginMainModule, PluginOverlayContext, PluginOverlayInstance } from '@thingsvis/schema';
import { Rect } from 'leafer-ui';
import { Spec } from './spec';

export const componentId = 'basic/switch';

/**
 * Create a Leafer placeholder rect for canvas rendering.
 * The actual switch UI is rendered via createOverlay.
 */
export function create() {
  return new Rect({
    width: 60,
    height: 30,
    fill: 'rgba(100, 100, 200, 0.1)',
    stroke: '#6965db',
    strokeWidth: 1,
    cornerRadius: 15,
    draggable: true,
    cursor: 'pointer'
  });
}

/**
 * Create a DOM overlay with the actual switch checkbox.
 */
export function createOverlay(ctx: PluginOverlayContext): PluginOverlayInstance {
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.pointerEvents = 'auto';

  const label = document.createElement('label');
  label.style.position = 'relative';
  label.style.display = 'inline-block';
  label.style.width = '50px';
  label.style.height = '26px';
  label.style.cursor = 'pointer';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = ctx.props?.checked as boolean ?? false;
  input.style.opacity = '0';
  input.style.width = '0';
  input.style.height = '0';

  const slider = document.createElement('span');
  slider.style.position = 'absolute';
  slider.style.top = '0';
  slider.style.left = '0';
  slider.style.right = '0';
  slider.style.bottom = '0';
  slider.style.backgroundColor = input.checked ? '#6965db' : '#ccc';
  slider.style.borderRadius = '26px';
  slider.style.transition = 'background-color 0.3s';

  const knob = document.createElement('span');
  knob.style.position = 'absolute';
  knob.style.height = '20px';
  knob.style.width = '20px';
  knob.style.left = input.checked ? '26px' : '3px';
  knob.style.bottom = '3px';
  knob.style.backgroundColor = 'white';
  knob.style.borderRadius = '50%';
  knob.style.transition = 'left 0.3s';
  knob.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';

  slider.appendChild(knob);
  label.appendChild(input);
  label.appendChild(slider);
  container.appendChild(label);

  input.addEventListener('change', () => {
    const checked = input.checked;
    slider.style.backgroundColor = checked ? '#6965db' : '#ccc';
    knob.style.left = checked ? '26px' : '3px';
    console.log('[basic/switch] changed:', checked);
  });

  return {
    element: container,
    update: (nextCtx: PluginOverlayContext) => {
      const nextChecked = nextCtx.props?.checked as boolean ?? false;
      if (input.checked !== nextChecked) {
        input.checked = nextChecked;
        slider.style.backgroundColor = nextChecked ? '#6965db' : '#ccc';
        knob.style.left = nextChecked ? '26px' : '3px';
      }
    },
    destroy: () => {
      container.remove();
    }
  };
}

export const Main: PluginMainModule = {
  componentId,
  create,
  createOverlay,
  Spec,
  schema: {
    props: {
      checked: {
        type: 'boolean',
        default: false,
        description: '开关状态'
      }
    }
  }
};

export default Main;
