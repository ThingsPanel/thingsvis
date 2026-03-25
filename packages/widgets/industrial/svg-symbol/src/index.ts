import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import { INDUSTRIAL_ICONS_MAP } from './icons-registry';
import zh from './locales/zh.json';
import en from './locales/en.json';

/**
 * Optionally re-color an SVG string by replacing the first significant fill value.
 * Only replaces fill attributes that contain hex colors to avoid clobbering "none" or "transparent".
 */
function applyIconColor(svgText: string, color: string): string {
  if (!color) return svgText;
  // Replace fill="#XXXXXX" patterns (preserving structural fills like stroke/marker)
  return svgText.replace(/fill="(#[0-9a-fA-F]{3,6}|rgb[^"]+)"/g, `fill="${color}"`);
}

function renderSvg(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  let finalSvg: string;

  // Priority 1: use selected icon from registry
  if (props.selectedIconId && INDUSTRIAL_ICONS_MAP[props.selectedIconId]) {
    finalSvg = INDUSTRIAL_ICONS_MAP[props.selectedIconId].svgContent;
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

export default Main;
