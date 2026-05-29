import * as THREE from 'three';

import type { PipeFlowRule, Props } from './schema';

export type FlowPipeEntry = {
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  originalMaterial: THREE.Material | THREE.Material[] | null;
  baseColor: THREE.Color;
  speed: number;
  phase: number;
};

function normalizeColor(value: string): THREE.Color {
  try {
    return new THREE.Color(value || '#ffffff');
  } catch {
    return new THREE.Color('#ffffff');
  }
}

function createFlowMaterial(color: THREE.Color) {
  return new THREE.MeshStandardMaterial({
    color: color.clone(),
    emissive: color.clone(),
    emissiveIntensity: 0.75,
    transparent: true,
    opacity: 0.92,
    roughness: 0.35,
    metalness: 0.05,
    depthWrite: true,
  });
}

function ruleMatches(rule: PipeFlowRule, meshName: string): boolean {
  if (!rule.visible || !rule.matcher) return false;

  if (rule.matcherType === 'exact') {
    return meshName === rule.matcher;
  }

  if (rule.matcherType === 'contains') {
    return meshName.includes(rule.matcher);
  }

  return meshName.startsWith(rule.matcher);
}

function resolveRule(meshName: string, rules: PipeFlowRule[]): PipeFlowRule | null {
  return rules.find((rule) => ruleMatches(rule, meshName)) ?? null;
}

export function clearPipeFlow(entries: FlowPipeEntry[]) {
  entries.forEach(({ mesh, material, originalMaterial }) => {
    if (originalMaterial) {
      mesh.material = originalMaterial;
    }

    material.dispose();
  });

  entries.length = 0;
}

export function mountPipeFlow(root: THREE.Object3D, props: Props, entries: FlowPipeEntry[]) {
  clearPipeFlow(entries);

  if (!props.showPipeFlow || props.pipeFlowRules.length === 0) {
    return;
  }

  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || !mesh.name) {
      return;
    }

    const rule = resolveRule(mesh.name, props.pipeFlowRules);
    if (!rule) {
      return;
    }

    const baseColor = normalizeColor(rule.color);
    const material = createFlowMaterial(baseColor);
    const originalMaterial = mesh.material ?? null;
    mesh.material = material;
    entries.push({
      mesh,
      material,
      originalMaterial,
      baseColor,
      speed: rule.speed,
      phase: entries.length * 0.7,
    });
  });
}

export function updatePipeFlow(entries: FlowPipeEntry[], enabled: boolean) {
  if (!enabled) {
    return;
  }

  entries.forEach(({ material, baseColor, phase, speed }) => {
    const pulse =
      0.55 + Math.sin((performance.now() / 1000) * Math.max(speed, 0.1) * 3 + phase) * 0.25;

    material.color.copy(baseColor).multiplyScalar(0.8 + pulse * 0.45);
    material.emissive.copy(baseColor);
    material.emissiveIntensity = 0.45 + pulse;
    material.opacity = 0.82 + pulse * 0.14;
  });
}
