import type { LocalIconsManifest } from './types';
import { resolveLocalIconsPublicUrl } from './publicPath';

let manifestPromise: Promise<LocalIconsManifest> | null = null;

export function loadLocalIconsManifest(): Promise<LocalIconsManifest> {
  if (!manifestPromise) {
    const publicPath = resolveLocalIconsPublicUrl('/local-icons/manifest.json');
    const candidates = Array.from(new Set([publicPath, '/local-icons/manifest.json']));
    manifestPromise = (async () => {
      let lastError: unknown;
      for (const url of candidates) {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to load local icons manifest: ${res.status}`);
          const data = (await res.json()) as LocalIconsManifest;
          const basePath = data.basePath || '/local-icons/icons';
          return {
            ...data,
            basePath:
              url.startsWith('/') && url !== publicPath
                ? basePath
                : resolveLocalIconsPublicUrl(basePath),
          };
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError ?? new Error('Failed to load local icons manifest');
    })().catch((error) => {
      manifestPromise = null;
      throw error;
    });
  }
  return manifestPromise;
}
