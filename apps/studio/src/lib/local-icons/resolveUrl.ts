import type { LocalIconEntry } from './types';
import { resolveLocalIconsPublicUrl } from './publicPath';

export function buildLocalIconAssetUrl(icon: LocalIconEntry, basePath?: string): string {
  const resolvedBase = basePath ?? resolveLocalIconsPublicUrl('/local-icons/icons');
  const segments = [...icon.categoryId.split('/'), icon.file].map((part) =>
    encodeURIComponent(part),
  );
  return `${resolvedBase}/${segments.join('/')}`;
}

export function isLocalIconSvg(icon: LocalIconEntry): boolean {
  return icon.kind === 'svg' || icon.ext.toLowerCase() === 'svg';
}

export async function fetchLocalIconSvg(icon: LocalIconEntry, basePath?: string): Promise<string> {
  if (!isLocalIconSvg(icon)) {
    throw new Error(`Icon is not SVG: ${icon.id}`);
  }

  const url = buildLocalIconAssetUrl(icon, basePath);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load icon: ${icon.id}`);
  }
  return response.text();
}
