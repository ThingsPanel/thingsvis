import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function generateId() { return Math.random().toString(36).slice(2, 9); }

function renderDecoParticles(props: Props, uuid: string): string {
  const width = 200;
  const height = 50;
  const rows = 4;
  const cols = 20;
  const rectSize = 3;
  
  const hGap = width / cols;
  const vGap = height / rows;
  
  let rects = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 随机丢弃一些点，增加错落感
      if (Math.random() > 0.7) continue;
      
      const x = (c * hGap) + (hGap - rectSize) / 2;
      const y = (r * vGap) + (vGap - rectSize) / 2;
      
      const dur = (1 + Math.random() * 2).toFixed(2);
      const begin = (Math.random() * 2).toFixed(2);
      
      let anim = '';
      if (props.animated) {
        anim = `<animate attributeName="opacity" values="0.8;0.1;0.8" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>`;
      }
      
      rects += `<rect x="${x}" y="${y}" width="${rectSize}" height="${rectSize}" fill="${props.color}" opacity="0.8" rx="0.5">${anim}</rect>\n      `;
    }
  }

  return `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" 
      style="position: absolute; top: 0; left: 0; pointer-events: none; overflow: visible;">
      ${rects}
    </svg>
  `;
}

export const Main = defineWidget({
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    element.style.width = '100%';
    element.style.height = '100%';
    element.dataset.thingsvisOverlay = metadata.id;
    
    // Create container
    let container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'relative';
    container.style.boxSizing = 'border-box';
    element.appendChild(container);
    
    const uuid = generateId();
    container.innerHTML = renderDecoParticles(props, uuid);
    container.style.opacity = props.opacity.toString();
    
    return {
      update: (nextProps: Props) => {
        container.innerHTML = renderDecoParticles(nextProps, uuid);
        container.style.opacity = nextProps.opacity.toString();
      },
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
