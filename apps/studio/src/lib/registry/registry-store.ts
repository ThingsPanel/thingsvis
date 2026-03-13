import type { ComponentRegistryEntry } from '@thingsvis/schema';
import {
  fetchRegistry,
  type ComponentRegistryMap,
  type RegistryListEntry,
  toRegistryEntries,
} from './registryClient';

export interface RegistryStoreSnapshot {
  map: ComponentRegistryMap;
  entries: RegistryListEntry[];
  loadedAt: number;
}

let registrySnapshot: RegistryStoreSnapshot | null = null;
let registryPromise: Promise<RegistryStoreSnapshot> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function getRegistrySnapshot(): RegistryStoreSnapshot | null {
  return registrySnapshot;
}

export function subscribeRegistry(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function ensureRegistryLoaded(url = '/registry.json'): Promise<RegistryStoreSnapshot> {
  if (registrySnapshot) {
    return registrySnapshot;
  }

  if (registryPromise) {
    return registryPromise;
  }

  registryPromise = (async () => {
    const registry = await fetchRegistry(url);
    const snapshot: RegistryStoreSnapshot = {
      map: registry.components,
      entries: toRegistryEntries(registry),
      loadedAt: Date.now(),
    };

    registrySnapshot = snapshot;
    notifyListeners();
    return snapshot;
  })();

  registryPromise.catch((error) => {
    console.error('[registry-store] Failed to load registry:', error);
    registryPromise = null;
  });

  try {
    const snapshot = await registryPromise;
    registryPromise = null;
    return snapshot;
  } catch (error) {
    registryPromise = null;
    throw error;
  }
}

export function getRegistryEntry(componentId: string): ComponentRegistryEntry | null {
  const actualId = componentId.replace(' (Local)', '');
  return registrySnapshot?.map[actualId] ?? null;
}
