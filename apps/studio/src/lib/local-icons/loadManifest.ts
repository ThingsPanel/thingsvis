import type { LocalIconsManifest } from './types';

let manifestPromise: Promise<LocalIconsManifest> | null = null;

export function loadLocalIconsManifest(): Promise<LocalIconsManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch('/local-icons/manifest.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load local icons manifest');
        return res.json() as Promise<LocalIconsManifest>;
      })
      .catch((error) => {
        manifestPromise = null;
        throw error;
      });
  }
  return manifestPromise;
}
