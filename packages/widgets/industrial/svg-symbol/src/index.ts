import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import { INDUSTRIAL_ICONS_MAP } from './icons-registry';
import zh from './locales/zh.json';
import en from './locales/en.json';

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Re-color an SVG string by replacing the primary industrial base colors.
 * Only replaces the design-system keys (#334155 base, #475569 highlight)
 * so that pipe flanges, strokes and indicator lights stay intact.
 */
function applyIconColor(svgText: string, color: string): string {
  if (!color) return svgText;
  const lightColor = lightenColor(color, 10);
  return svgText
    .replace(/fill="#334155"/g, `fill="${color}"`)
    .replace(/stop-color="#334155"/g, `stop-color="${color}"`)
    .replace(/fill="#475569"/g, `fill="${lightColor}"`)
    .replace(/stop-color="#475569"/g, `stop-color="${lightColor}"`);
}

function renderSvg(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  let finalSvg: string;

  // Priority 1: use selected icon from registry
  const selectedIcon = props.selectedIconId
    ? INDUSTRIAL_ICONS_MAP[props.selectedIconId]
    : undefined;

  if (selectedIcon) {
    finalSvg = selectedIcon.svgContent;
  } else {
    // Priority 2: fall back to custom raw SVG content
    finalSvg = props.svgContent;
  }

  // Apply optional color override
  if (props.iconColor) {
    finalSvg = applyIconColor(finalSvg, props.iconColor);
  }

  element.innerHTML = finalSvg;
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
  render: (element: HTMLElement, props: Props) => {
    renderSvg(element, props);

    return {
      update: (nextProps: Props) => {
        renderSvg(element, nextProps);
      },
      destroy: () => {
        element.innerHTML = '';
      },
    };
  },
});

// Expose registry so the Studio editor can auto-resize to fit each symbol
(Main as any).iconsRegistry = INDUSTRIAL_ICONS_MAP;

export default Main;
