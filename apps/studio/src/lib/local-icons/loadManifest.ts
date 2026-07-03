import type { LocalIconsManifest } from './types';
import { resolveLocalIconsPublicUrl } from './publicPath';

let manifestPromise: Promise<LocalIconsManifest> | null = null;

export function loadLocalIconsManifest(): Promise<LocalIconsManifest> {
  if (!manifestPromise) {
    manifestPromise = fetch(resolveLocalIconsPublicUrl('/local-icons/manifest.json'))
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load local icons manifest');
        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.includes('json')) {
          throw new Error('Local icons manifest returned non-JSON response');
        }
        const data = (await res.json()) as LocalIconsManifest;
        return {
          ...data,
          basePath: resolveLocalIconsPublicUrl(data.basePath || '/local-icons/icons'),
        };
      })
      .catch((error) => {
        manifestPromise = null;
        throw error;
      });
  }
  return manifestPromise;
}
