import type { LocalIconEntry } from './types';

export function buildLocalIconAssetUrl(
  icon: LocalIconEntry,
  basePath = '/local-icons/icons',
): string {
  const segments = [...icon.categoryId.split('/'), icon.file].map((part) =>
    encodeURIComponent(part),
  );
  return `${basePath}/${segments.join('/')}`;
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
