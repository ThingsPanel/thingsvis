import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { Props, SceneLabel } from './schema';

const LABEL_STYLE_ID = 'tv-model-3d-scene-label-styles';

const LABEL_VALUE_PROP_BY_ANCHOR: Record<string, keyof Props> = {
  anchor_pv: 'labelValue_pv',
  anchor_storage: 'labelValue_storage',
  anchor_substation: 'labelValue_substation',
  anchor_workshop: 'labelValue_workshop',
  anchor_pump: 'labelValue_pump',
};

function formatLabelValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '--';
  }
  return String(value);
}

function resolveDisplayedValue(anchor: string, cfg: SceneLabel, props: Props): string {
  const boundProp = LABEL_VALUE_PROP_BY_ANCHOR[anchor];
  if (boundProp) {
    const boundValue = formatLabelValue(props[boundProp]);
    if (boundValue) {
      return boundValue;
    }
  }
  return cfg.value || '--';
}

export type SceneLabelEntry = {
  anchor: string;
  object: CSS2DObject;
  rootEl: HTMLDivElement;
  titleEl: HTMLDivElement;
  valueEl: HTMLSpanElement;
  unitEl: HTMLSpanElement;
};

export function ensureSceneLabelStyles(host: HTMLElement) {
  if (host.querySelector(`#${LABEL_STYLE_ID}`)) {
    return;
  }

  const style = document.createElement('style');
  style.id = LABEL_STYLE_ID;
  style.textContent = `
    .tv-scene-label {
      padding: 6px 12px;
      background: rgba(8, 28, 68, 0.82);
      border: 1px solid rgba(60, 140, 255, 0.55);
      border-radius: 4px;
      color: #e8f4ff;
      font-size: 12px;
      line-height: 1.35;
      white-space: nowrap;
      transform: translate(-50%, -100%);
      box-shadow: 0 0 12px rgba(40, 120, 255, 0.35);
      pointer-events: none;
      user-select: none;
    }
    .tv-scene-label__title {
      opacity: 0.92;
    }
    .tv-scene-label__value {
      margin-top: 2px;
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .tv-scene-label__num {
      font-size: 16px;
      font-weight: 700;
      color: #7ec8ff;
    }
    .tv-scene-label__unit {
      font-size: 12px;
      opacity: 0.85;
    }
  `;
  host.appendChild(style);
}

export function createSceneLabelRenderer(host: HTMLElement) {
  ensureSceneLabelStyles(host);
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.inset = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  host.appendChild(labelRenderer.domElement);
  return labelRenderer;
}

function resolveLabelConfig(
  anchorName: string,
  configMap: Map<string, SceneLabel>,
): SceneLabel {
  const configured = configMap.get(anchorName);
  if (configured) {
    return configured;
  }

  return {
    anchor: anchorName,
    title: anchorName.replace(/^anchor_/, '').replace(/_/g, ' '),
    value: '--',
    unit: '',
    visible: true,
  };
}

function createLabelElement(cfg: SceneLabel) {
  const el = document.createElement('div');
  el.className = 'tv-scene-label';

  const titleEl = document.createElement('div');
  titleEl.className = 'tv-scene-label__title';
  titleEl.textContent = cfg.title;

  const valueWrap = document.createElement('div');
  valueWrap.className = 'tv-scene-label__value';

  const valueEl = document.createElement('span');
  valueEl.className = 'tv-scene-label__num';
  valueEl.textContent = cfg.value || '--';

  const unitEl = document.createElement('span');
  unitEl.className = 'tv-scene-label__unit';
  unitEl.textContent = cfg.unit;

  valueWrap.appendChild(valueEl);
  valueWrap.appendChild(unitEl);
  el.appendChild(titleEl);
  el.appendChild(valueWrap);

  el.style.display = cfg.visible ? '' : 'none';

  return { el, titleEl, valueEl, unitEl };
}

export function clearSceneLabels(entries: SceneLabelEntry[]) {
  entries.forEach(({ object, rootEl }) => {
    object.removeFromParent();
    rootEl.remove();
  });
  entries.length = 0;
}

export function mountSceneLabels(
  root: THREE.Object3D,
  props: Props,
  entries: SceneLabelEntry[],
) {
  clearSceneLabels(entries);
  if (!props.showSceneLabels) {
    return;
  }

  const configMap = new Map(props.sceneLabels.map((item) => [item.anchor, item]));

  root.traverse((node) => {
    const name = node.name?.trim();
    if (!name || !name.startsWith(props.labelAnchorPrefix)) {
      return;
    }

    const cfg = resolveLabelConfig(name, configMap);
    const { el, titleEl, valueEl, unitEl } = createLabelElement(cfg);
    valueEl.textContent = resolveDisplayedValue(name, cfg, props);

    const label = new CSS2DObject(el);
    label.position.set(0, props.labelOffsetY, 0);
    node.add(label);

    entries.push({
      anchor: name,
      object: label,
      rootEl: el,
      titleEl,
      valueEl,
      unitEl,
    });
  });
}

export function syncSceneLabelValues(props: Props, entries: SceneLabelEntry[]) {
  const configMap = new Map(props.sceneLabels.map((item) => [item.anchor, item]));

  entries.forEach(({ anchor, rootEl, titleEl, valueEl, unitEl }) => {
    const cfg = resolveLabelConfig(anchor, configMap);
    titleEl.textContent = cfg.title;
    valueEl.textContent = resolveDisplayedValue(anchor, cfg, props);
    unitEl.textContent = cfg.unit;
    rootEl.style.display = props.showSceneLabels && cfg.visible ? '' : 'none';
  });
}
