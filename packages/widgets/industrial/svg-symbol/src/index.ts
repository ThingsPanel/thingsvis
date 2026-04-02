import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget } from '@thingsvis/widget-sdk';
import { INDUSTRIAL_ICONS_MAP } from './icons-registry';
import zh from './locales/zh.json';
import en from './locales/en.json';

const DEFAULT_PROPS = PropsSchema.parse({});

const STATUS_COLORS: Record<string, string> = {
  normal: '#64748b',
  running: '#22c55e',
  warning: '#eab308',
  fault: '#ef4444',
  offline: '#94a3b8',
};

function normalizeProps(input: Partial<Props> | undefined): Props {
  const source = input ?? {};
  const rawMode = source.stateMode;
  const validModes = ['normal', 'running', 'warning', 'fault', 'offline'];
  return {
    selectedIconId: source.selectedIconId || DEFAULT_PROPS.selectedIconId,
    svgContent: source.svgContent ?? DEFAULT_PROPS.svgContent,
    stateMode: rawMode && validModes.includes(rawMode) ? rawMode : undefined,
    animateEnabled: source.animateEnabled ?? DEFAULT_PROPS.animateEnabled,
  };
}

function expandRootViewBox(svgText: string): string {
  const match = svgText.match(/viewBox="([^"]+)"/i);
  const rawViewBox = match?.[1];
  if (!rawViewBox) return svgText;
  const parts = rawViewBox.trim().split(/\s+/).map((p) => Number.parseFloat(p));
  if (parts.length !== 4 || parts.some((v) => Number.isNaN(v))) return svgText;
  const [minX, minY, width, height] = parts as [number, number, number, number];
  const padding = Math.max(1.5, Math.min(width, height) * 0.04);
  return svgText.replace(
    /viewBox="([^"]+)"/i,
    `viewBox="${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}"`,
  );
}

/**
 * Inject SVG-native animations for all recognised animation markers:
 *   tv-rotor     — rotary blade (pump, fan)
 *   tv-wifi-1/2/3 — IoT WiFi arcs inner→outer sweep
 *   tv-wifi-dot   — IoT center signal dot pulse
 */
function injectAnimations(svgText: string): string {
  let result = svgText;

  // Rotary blade
  const rotorMarker = '<g id="tv-rotor">';
  if (result.includes(rotorMarker)) {
    const anim =
      '<animateTransform attributeName="transform" type="rotate" from="0 50 30" to="360 50 30" dur="1.2s" repeatCount="indefinite" additive="sum"/>';
    result = result.replace(rotorMarker, `${rotorMarker}${anim}`);
  }

  // WiFi signal sweep: inner arc fires first, outer last (0.4 s stagger)
  const wifiSweep: Array<{ id: string; begin: string }> = [
    { id: 'tv-wifi-3', begin: '0s' },
    { id: 'tv-wifi-2', begin: '0.4s' },
    { id: 'tv-wifi-1', begin: '0.8s' },
  ];
  for (const { id, begin } of wifiSweep) {
    result = result.replace(
      new RegExp(`(<g id="${id}"[^>]*>)`),
      `$1<animate attributeName="opacity" values="0.1;1;0.1" dur="1.5s" begin="${begin}" repeatCount="indefinite"/>`,
    );
  }

  // Center dot gentle breathe
  const dotMarker = '<g id="tv-wifi-dot">';
  if (result.includes(dotMarker)) {
    result = result.replace(
      dotMarker,
      `${dotMarker}<animate attributeName="opacity" values="0.5;1;0.5" dur="0.9s" repeatCount="indefinite"/>`,
    );
  }

  return result;
}

function injectStatusDot(svgText: string, mode: Props['stateMode']): string {
  if (!mode || mode === 'normal') return svgText;
  const match = svgText.match(/viewBox="([^"]+)"/i);
  const rawViewBox = match?.[1];
  if (!rawViewBox) return svgText;
  const parts = rawViewBox.trim().split(/\s+/).map((p) => Number.parseFloat(p));
  if (parts.length !== 4 || parts.some((v) => Number.isNaN(v))) return svgText;
  const [minX, minY, width, height] = parts as [number, number, number, number];
  const r = Math.min(width, height) * 0.055;
  // Place dot inside the viewBox with full margin so expandRootViewBox won't clip it
  const cx = minX + width - r * 2;
  const cy = minY + height - r * 2;
  const color = STATUS_COLORS[mode] ?? '#64748b';
  const blink =
    mode === 'fault' || mode === 'warning'
      ? `<animate attributeName="opacity" values="1;0.15;1" dur="1.1s" repeatCount="indefinite"/>`
      : '';
  const dot = `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${color}" stroke="#fff" stroke-width="${(r * 0.35).toFixed(2)}">${blink}</circle>`;
  return svgText.replace('</svg>', `${dot}</svg>`);
}

function renderSvg(element: HTMLElement, props: Props): void {
  element.style.width = '100%';
  element.style.height = '100%';

  const fallbackSvg = INDUSTRIAL_ICONS_MAP['iot-device']?.svgContent ?? '';
  let finalSvg = '';

  const selectedIcon = props.selectedIconId ? INDUSTRIAL_ICONS_MAP[props.selectedIconId] : undefined;
  if (selectedIcon) finalSvg = selectedIcon.svgContent;
  if (!finalSvg && typeof props.svgContent === 'string') finalSvg = props.svgContent.trim();
  if (!finalSvg || !finalSvg.includes('<svg')) finalSvg = fallbackSvg;
  if (!finalSvg) { element.innerHTML = ''; return; }

  // Inject dot BEFORE expanding viewBox — expansion then adds margin around the dot too
  finalSvg = injectStatusDot(finalSvg, props.stateMode);
  finalSvg = expandRootViewBox(finalSvg);
  if (props.animateEnabled) finalSvg = injectAnimations(finalSvg);
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
    let currentProps = normalizeProps(props as Partial<Props>);

    renderSvg(element, currentProps);

    return {
      update: (nextProps: Props) => {
        currentProps = normalizeProps(nextProps as Partial<Props>);
        renderSvg(element, currentProps);
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
